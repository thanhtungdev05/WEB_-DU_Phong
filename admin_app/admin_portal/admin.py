"""
Django Admin registration cho FTC Admin Portal.
Cấu hình giao diện chuẩn mực, sạch sẽ, không dùng icon emoji.
Bao gồm bộ lọc, tìm kiếm, xem chi tiết và xuất CSV.
"""
import csv
from django.contrib import admin, messages
from django.contrib.postgres.aggregates import StringAgg
from django.db.models import Count, Q
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html

from .models import (
    DeviceCatalog, LabCatalog, Role, FtcUser, TimerSession, TimerSessionAssignmentLink,
    Region, OrgUnit, LoginLog, RosterImportLog, SchemaMigration,
    Curriculum, CurriculumLab, TrainingClass, ClassEnrollment,
    ClassLabAssignment, LabAssignment, AssignmentImportLog,
)


PRACTICE_MODE_VALUES = ('Thực hành', 'practice')
GUIDE_MODE_VALUES = ('Hướng dẫn', 'guide')
KNOWN_MODE_VALUES = PRACTICE_MODE_VALUES + GUIDE_MODE_VALUES


def build_session_mode_query(mode_type):
    """Prefer a recognized mode and only use session_type for legacy rows."""
    mode_values = {
        'practice': PRACTICE_MODE_VALUES,
        'guide': GUIDE_MODE_VALUES,
    }.get(mode_type)
    if mode_values is None:
        return None

    missing_or_unknown_mode = (
        Q(mode__isnull=True)
        | ~Q(mode__in=KNOWN_MODE_VALUES)
    )
    return (
        Q(mode__in=mode_values)
        | (missing_or_unknown_mode & Q(session_type=mode_type))
    )


def resolve_session_mode(mode, session_type):
    """Return the display mode using the same precedence as the list filter."""
    if mode in GUIDE_MODE_VALUES:
        return 'guide'
    if mode in PRACTICE_MODE_VALUES:
        return 'practice'
    return 'guide' if session_type == 'guide' else 'practice'


# ===========================================================
# Custom Admin Site
# ===========================================================

admin.site.site_header = "FPT Telecom - FTC Admin Portal"
admin.site.site_title = "FTC Admin"
admin.site.index_title = "Tổng Quan Quản Trị Hệ Thống"


# ===========================================================
# CSV Export Helper
# ===========================================================

def _make_csv_export(filename, fields):
    def export_csv(modeladmin, request, queryset):
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        writer = csv.writer(response)
        writer.writerow(fields)
        for obj in queryset:
            row = []
            for f in fields:
                val = getattr(obj, f, '')
                row.append(str(val) if val is not None else '')
            writer.writerow(row)
        return response
    export_csv.short_description = f"Xuất CSV ({filename})"
    return export_csv


# ===========================================================
# DeviceCatalog Admin
# ===========================================================

@admin.register(DeviceCatalog)
class DeviceCatalogAdmin(admin.ModelAdmin):
    list_display = ['device_id', 'device_name', 'model', 'sort_order',
                    'is_active', 'lab_count_badge']
    list_filter = ['is_active']
    search_fields = ['device_id', 'device_name', 'model']
    readonly_fields = ['device_id', 'created_at', 'updated_at']
    ordering = ['sort_order', 'device_name']
    list_per_page = 50

    def lab_count_badge(self, obj):
        count = obj.labs.filter(is_active=True).count()
        bg = '#059669' if count > 0 else '#6b7280'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:12px;font-weight:500;">{} bài lab</span>',
            bg, count
        )
    lab_count_badge.short_description = 'Số bài lab'

    actions = [_make_csv_export('device_catalog',
               ['device_id', 'device_name', 'model', 'sort_order', 'is_active'])]


# ===========================================================
# LabCatalog Admin
# ===========================================================

@admin.register(LabCatalog)
class LabCatalogAdmin(admin.ModelAdmin):
    list_display = ['lab_id', 'lab_name', 'device', 'sort_order', 'is_active']
    list_filter = ['is_active', 'device']
    search_fields = ['lab_id', 'lab_name', 'device__device_name']
    readonly_fields = ['lab_id', 'created_at', 'updated_at']
    ordering = ['device_id', 'sort_order']
    list_per_page = 100
    actions = [_make_csv_export('lab_catalog',
               ['lab_id', 'lab_name', 'device_id', 'sort_order', 'is_active'])]


# ===========================================================
# Role Admin (system definitions are read-only)
# ===========================================================

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['role_code', 'role_name', 'is_admin', 'can_export_reports', 'sort_order']
    list_filter = ['is_admin', 'can_export_reports']
    search_fields = ['role_code', 'role_name']
    ordering = ['sort_order', 'role_code']
    readonly_fields = [
        'role_code', 'role_name', 'is_admin', 'can_export_reports',
        'sort_order', 'created_at', 'updated_at',
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ===========================================================
# FtcUser Admin
# ===========================================================

class TerminationFilter(admin.SimpleListFilter):
    title = 'Trạng thái nhân sự'
    parameter_name = 'term_status'

    def lookups(self, request, model_admin):
        return [
            ('active', 'Đang làm việc'),
            ('terminated', 'Đã nghỉ việc'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'active':
            return queryset.filter(is_terminated=False)
        if self.value() == 'terminated':
            return queryset.filter(is_terminated=True)
        return queryset


@admin.register(FtcUser)
class FtcUserAdmin(admin.ModelAdmin):
    list_display = [
        'display_name', 'employee_id', 'email', 'role',
        'unit_name', 'region_badge', 'branch_badge', 'assigned_classes_badge',
        'employment_status_badge', 'last_login_at',
    ]
    list_filter = ['role', TerminationFilter, 'unit__region']
    # Email remains visible and clickable when display_name has not been set.
    list_display_links = ['display_name', 'email']
    search_fields = ['email', 'display_name', 'employee_id',
                     'unit_code', 'unit_name', 'class_code',
                     'class_enrollments__training_class__class_code',
                     'class_enrollments__training_class__class_name',
                     'unit__unit_code', 'unit__unit_name',
                     'unit__region__region_code', 'unit__region__region_name']
    list_select_related = ['role', 'unit', 'unit__region']
    readonly_fields = [
        'user_id', 'last_login_at', 'created_at', 'updated_at',
        'employee_source', 'employee_seed_batch', 'employee_synced_at',
        'unit_code', 'unit_name', 'region',
        'region_code', 'dashboard_region', 'class_code',
    ]
    fieldsets = [
        ('Thông tin cơ bản', {
            'fields': ('user_id', 'email', 'display_name', 'role', 'last_login_at')
        }),
        ('Thông tin nhân sự', {
            'fields': ('employee_id', 'job_title', 'class_code',
                       'training_start_date', 'training_end_date')
        }),
        ('Đơn vị & Khu vực', {
            'fields': ('unit', 'unit_code', 'unit_name', 'region')
        }),
        ('Trạng thái công việc', {
            'fields': ('is_terminated', 'termination_date', 'termination_reason')
        }),
        ('Metadata hệ thống', {
            'classes': ('collapse',),
            'fields': ('employee_source', 'employee_seed_batch',
                       'employee_synced_at', 'region_code', 'dashboard_region',
                       'created_at', 'updated_at')
        }),
    ]
    list_per_page = 50
    autocomplete_fields = ['unit']
    show_full_result_count = True
    date_hierarchy = 'created_at'

    def get_queryset(self, request):
        today = timezone.localdate()
        assignment_filter = (
            Q(class_enrollments__status='active')
            & Q(class_enrollments__is_mock=False)
            & Q(class_enrollments__valid_from__lte=today)
            & (Q(class_enrollments__valid_to__isnull=True) | Q(class_enrollments__valid_to__gte=today))
            & Q(class_enrollments__training_class__status__in=('planned', 'active'))
            & Q(class_enrollments__training_class__is_mock=False)
& Q(class_enrollments__training_class__start_date__lte=today)
        )
        return super().get_queryset(request).annotate(
            assigned_class_codes=StringAgg(
                'class_enrollments__training_class__class_code',
                delimiter=', ',
                distinct=True,
                filter=assignment_filter,
            )
        )

    @admin.display(description='Lớp được phân', ordering='assigned_class_codes')
    def assigned_classes_badge(self, obj):
        if obj.assigned_class_codes:
            return format_html(
                '<span style="background:#1d4ed8;color:#fff;padding:2px 8px;'
                'border-radius:4px;font-size:12px;font-weight:500;">{}</span>',
                obj.assigned_class_codes,
            )
        if obj.class_code:
            return format_html(
                '<span title="Mã lớp nguồn cũ; không dùng làm mẫu số báo cáo" '
                'style="background:#6b7280;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">'
                '{} (nguồn)</span>',
                obj.class_code,
            )
        return '-'

    def save_model(self, request, obj, form, change):
        # unit_id is canonical; keep legacy columns synchronized for old consumers.
        if obj.unit_id and obj.unit:
            obj.unit_code = obj.unit.unit_code
            obj.unit_name = obj.unit.unit_name
            obj.region = obj.unit.region
            obj.region_code = obj.unit.region.region_code
            obj.dashboard_region = obj.unit.region.dashboard_group or obj.unit.region.region_name
        else:
            obj.unit_code = None
            obj.unit_name = None
            obj.region = None
            obj.region_code = None
            obj.dashboard_region = None
        super().save_model(request, obj, form, change)
        LabAssignment.objects.filter(enrollment__user_id=obj.user_id).update(
            unit_snapshot_id=obj.unit_id,
            region_snapshot_id=obj.region_id,
            updated_at=timezone.now(),
        )

    def region_badge(self, obj):
        if obj.unit_id and obj.unit and obj.unit.region:
            return format_html(
                '<span style="background:#1d4ed8;color:#fff;padding:2px 8px;'
                'border-radius:4px;font-size:12px;font-weight:500;">{}</span>',
                obj.unit.region.region_name
            )
        return '-'

    def branch_badge(self, obj):
        return obj.unit.unit_name if obj.unit_id and obj.unit else '-'
    branch_badge.short_description = 'Chi nhánh'
    region_badge.short_description = 'Khu vực'

    def employment_status_badge(self, obj):
        if obj.is_terminated:
            return format_html(
                '<span style="background:#dc2626;color:#fff;padding:2px 8px;'
                'border-radius:4px;font-size:12px;">Đã nghỉ việc</span>'
            )
        return format_html(
            '<span style="background:#059669;color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:12px;">Đang làm việc</span>'
        )
    employment_status_badge.short_description = 'Trạng thái'

    @admin.action(description='Chỉnh sửa user đã chọn', permissions=['change'])
    def edit_selected_user(self, request, queryset):
        selected_users = list(queryset[:2])
        if len(selected_users) != 1:
            self.message_user(
                request,
                'Vui lòng chọn đúng một user để chỉnh sửa.',
                level=messages.WARNING,
            )
            return None

        selected_user = selected_users[0]
        if not self.has_change_permission(request, selected_user):
            self.message_user(
                request,
                'Bạn không có quyền chỉnh sửa user này.',
                level=messages.ERROR,
            )
            return None

        return HttpResponseRedirect(reverse(
            'admin:admin_portal_ftcuser_change',
            args=(selected_user.pk,),
        ))

    actions = ['edit_selected_user', _make_csv_export('users',
               ['employee_id', 'display_name', 'email', 'role_id',
                'unit_code', 'unit_name', 'dashboard_region',
                'class_code', 'is_terminated', 'last_login_at'])]


# ===========================================================
# TimerSession Admin
# ===========================================================

class TimerSessionAssignmentLinkInline(admin.TabularInline):
    model = TimerSessionAssignmentLink
    fk_name = 'timer_session'
    fields = ['assignment', 'link_source', 'linked_at']
    readonly_fields = fields
    extra = 0
    can_delete = False
    show_change_link = False

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class SessionAssignmentAttributionFilter(admin.SimpleListFilter):
    title = 'Quy thuộc phân lớp'
    parameter_name = 'assignment_attribution'

    def lookups(self, request, model_admin):
        return [
            ('linked', 'Đã quy lớp'),
            ('unlinked', 'Chưa quy lớp'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'linked':
            return queryset.filter(assignment_links__isnull=False).distinct()
        if self.value() == 'unlinked':
            return queryset.filter(assignment_links__isnull=True)
        return queryset


class PassedFilter(admin.SimpleListFilter):
    title = 'Kết quả bài thi'
    parameter_name = 'passed'

    def lookups(self, request, model_admin):
        return [
            ('yes', 'Đạt yêu cầu'),
            ('no', 'Không đạt'),
            ('null', 'Chưa xác định'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(is_passed=True)
        if self.value() == 'no':
            return queryset.filter(is_passed=False)
        if self.value() == 'null':
            return queryset.filter(is_passed__isnull=True)
        return queryset


class MockDataFilter(admin.SimpleListFilter):
    title = 'Phân loại dữ liệu'
    parameter_name = 'mock'

    def lookups(self, request, model_admin):
        return [
            ('real', 'Dữ liệu thực tế'),
            ('mock', 'Dữ liệu Test/Mock'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'real':
            return queryset.filter(is_mock=False)
        if self.value() == 'mock':
            return queryset.filter(is_mock=True)
        return queryset


class ModeFilter(admin.SimpleListFilter):
    title = 'Chế độ bài học'
    parameter_name = 'mode_type'

    def lookups(self, request, model_admin):
        return [
            ('practice', 'Thực hành'),
            ('guide', 'Hướng dẫn'),
        ]

    def queryset(self, request, queryset):
        mode_query = build_session_mode_query(self.value())
        return queryset.filter(mode_query) if mode_query is not None else queryset


@admin.register(TimerSession)
class TimerSessionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'name', 'technician_id', 'lab_name', 'device', 'mode_badge',
        'status_badge', 'passed_badge', 'score', 'duration_display',
        'assignment_classes_badge', 'finished_at', 'data_type_badge',
    ]
    list_filter = [
        'status', PassedFilter, MockDataFilter, ModeFilter,
        SessionAssignmentAttributionFilter,
        'assignment_links__assignment__class_snapshot', 'device',
    ]
    search_fields = [
        'technician_id', 'name', 'email', 'lab_id', 'lab_name',
        'device__device_id', 'device__device_name', 'device_name_snapshot',
        'assignment_links__assignment__class_snapshot__class_code',
    ]
    readonly_fields = [
        'id', 'user', 'created_at', 'started_at', 'finished_at',
        'client_ip', 'user_agent', 'device', 'grading_details_pretty',
    ]
    fieldsets = [
        ('Định danh KTV', {
            'fields': ('id', 'user', 'technician_id', 'name', 'email')
        }),
        ('Bài thực hành', {
            'fields': ('lab_id', 'lab_name', 'device', 'device_name_snapshot',
                       'mode', 'session_type')
        }),
        ('Kết quả đánh giá', {
            'fields': ('status', 'is_passed', 'score', 'completed_first_try',
                       'practice_attempt_no', 'attempt_sequence_complete', 'last_action')
        }),
        ('Thời gian', {
            'fields': ('started_at', 'finished_at', 'created_at')
        }),
        ('Chi tiết chấm điểm', {
            'classes': ('collapse',),
            'fields': ('grading_details_pretty',)
        }),
        ('Telemetry & Audit', {
            'classes': ('collapse',),
            'fields': ('client_ip', 'user_agent', 'is_mock', 'seed_batch', 'seed_key')
        }),
    ]
    date_hierarchy = 'finished_at'
    list_select_related = ['user', 'device']
    list_per_page = 50
    show_full_result_count = True
    inlines = [TimerSessionAssignmentLinkInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            linked_class_codes=StringAgg(
                'assignment_links__assignment__class_snapshot__class_code',
                delimiter=', ',
                distinct=True,
            )
        )

    @admin.display(description='Lớp quy thuộc', ordering='linked_class_codes')
    def assignment_classes_badge(self, obj):
        if obj.linked_class_codes:
            return format_html(
                '<span style="background:#1d4ed8;color:#fff;padding:2px 8px;'
                'border-radius:4px;font-size:12px;">{}</span>',
                obj.linked_class_codes,
            )
        return format_html(
            '<span title="Không có assignment hiệu lực tại thời điểm phiên" '
            'style="color:#92400e;font-size:11px;">Chưa quy lớp</span>'
        )

    def mode_badge(self, obj):
        if resolve_session_mode(obj.mode, obj.session_type) == 'guide':
            return format_html(
                '<span style="background:#0284c7;color:#fff;padding:2px 8px;'
                'border-radius:4px;font-size:12px;font-weight:500;">Hướng dẫn</span>'
            )
        return format_html(
            '<span style="background:#6366f1;color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:12px;font-weight:500;">Thực hành</span>'
        )
    mode_badge.short_description = 'Chế độ'
    mode_badge.admin_order_field = 'mode'

    def status_badge(self, obj):
        colors = {
            'completed': '#059669',
            'failed': '#dc2626',
            'abandoned': '#d97706',
            'in_progress': '#64748b',
        }
        labels = {
            'completed': 'Hoàn thành',
            'failed': 'Không đạt',
            'abandoned': 'Bỏ dở',
            'in_progress': 'Đang thực hiện',
        }
        color = colors.get(obj.status, '#6b7280')
        label = labels.get(obj.status, obj.status)
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:12px;font-weight:500;">{}</span>',
            color, label
        )
    status_badge.short_description = 'Trạng thái'

    def passed_badge(self, obj):
        if obj.is_passed is None:
            return format_html('<span style="color:#9ca3af;">-</span>')
        if obj.is_passed:
            return format_html(
                '<span style="background:#059669;color:#fff;padding:2px 8px;'
                'border-radius:4px;font-size:12px;font-weight:500;">Đạt</span>'
            )
        return format_html(
            '<span style="background:#dc2626;color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:12px;font-weight:500;">Không đạt</span>'
        )
    passed_badge.short_description = 'Kết quả'

    def duration_display(self, obj):
        if not obj.duration_sec:
            return '-'
        m, s = divmod(obj.duration_sec, 60)
        h, m = divmod(m, 60)
        if h:
            return f"{h}h {m:02d}m"
        return f"{m}m {s:02d}s"
    duration_display.short_description = 'Thời lượng'

    def data_type_badge(self, obj):
        if obj.is_mock:
            return format_html(
                '<span style="background:#4b5563;color:#fff;padding:2px 6px;'
                'border-radius:4px;font-size:11px;">Test</span>'
            )
        return format_html(
            '<span style="background:#2563eb;color:#fff;padding:2px 6px;'
            'border-radius:4px;font-size:11px;">Thực tế</span>'
        )
    data_type_badge.short_description = 'Loại dữ liệu'

    def grading_details_pretty(self, obj):
        if not obj.grading_details:
            return '-'
        import json
        pretty = json.dumps(obj.grading_details, ensure_ascii=False, indent=2)
        return format_html(
            '<pre style="background:#0f172a;color:#f8fafc;padding:12px;'
            'border-radius:6px;overflow:auto;max-height:400px;font-size:12px;">{}</pre>',
            pretty
        )
    grading_details_pretty.short_description = 'Chi tiết chấm điểm (JSON)'

    def export_real_csv(modeladmin, request, queryset):
        qs = queryset.filter(is_mock=False)
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="timer_sessions_real.csv"'
        writer = csv.writer(response)
        writer.writerow(['session_id', 'technician_id', 'name', 'email',
                         'lab_id', 'lab_name', 'device_id', 'device_snapshot',
                         'mode', 'status',
                         'is_passed', 'score', 'duration_sec', 'finished_at',
                         'client_ip'])
        for obj in qs:
            writer.writerow([
                str(obj.id), obj.technician_id, obj.name, obj.email,
                obj.lab_id, obj.lab_name, obj.device_id,
                obj.device_name_snapshot, obj.mode, obj.status,
                obj.is_passed, obj.score, obj.duration_sec, obj.finished_at,
                obj.client_ip,
            ])
        return response
    export_real_csv.short_description = "Xuất CSV (chỉ dữ liệu thực tế)"

    actions = [export_real_csv,
               _make_csv_export('timer_sessions_all',
               ['id', 'technician_id', 'name', 'email', 'lab_id', 'lab_name',
                'device_id', 'device_name_snapshot', 'mode', 'status',
                'is_passed', 'score',
                'duration_sec', 'finished_at', 'is_mock'])]


# ===========================================================
# Region Admin
# ===========================================================

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['region_code', 'region_name', 'dashboard_group', 'is_active']
    list_filter = ['is_active', 'dashboard_group']
    search_fields = ['region_code', 'region_name']
    readonly_fields = ['region_id', 'created_at', 'updated_at']
    list_per_page = 100


@admin.register(OrgUnit)
class OrgUnitAdmin(admin.ModelAdmin):
    list_display = ['unit_code', 'unit_name', 'region', 'is_active', 'updated_at']
    list_filter = ['is_active', 'region']
    search_fields = ['unit_code', 'unit_name', 'region__region_code', 'region__region_name']
    list_select_related = ['region']
    readonly_fields = ['unit_id', 'unit_code', 'unit_name', 'region', 'is_active', 'created_at', 'updated_at']
    list_per_page = 100

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ===========================================================
# Audit logs (read-only)
# ===========================================================

class ReadOnlyAuditAdmin(admin.ModelAdmin):
    actions = None

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class ReadOnlyInline(admin.TabularInline):
    extra = 0
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class ClassEnrollmentInline(ReadOnlyInline):
    model = ClassEnrollment
    fields = ['user', 'status', 'valid_from', 'valid_to', 'source_class_code', 'is_mock']
    readonly_fields = fields
    ordering = ['-valid_from', 'user__display_name']


class ClassLabAssignmentInline(ReadOnlyInline):
    model = ClassLabAssignment
    fields = ['curriculum_lab', 'assigned_at', 'due_at', 'status', 'assignment_source']
    readonly_fields = fields
    ordering = ['curriculum_lab__sort_order']


class AssignmentTimerSessionLinkInline(ReadOnlyInline):
    model = TimerSessionAssignmentLink
    fk_name = 'assignment'
    fields = ['timer_session', 'link_source', 'linked_at']
    readonly_fields = fields
    ordering = ['-linked_at']


@admin.register(Curriculum)
class CurriculumAdmin(ReadOnlyAuditAdmin):
    list_display = ['curriculum_code', 'version', 'curriculum_name', 'status', 'is_default', 'effective_from', 'effective_to']
    list_filter = ['status', 'is_default']
    search_fields = ['curriculum_code', 'version', 'curriculum_name']
    ordering = ['curriculum_code', '-version']


@admin.register(CurriculumLab)
class CurriculumLabAdmin(ReadOnlyAuditAdmin):
    list_display = ['curriculum', 'lab', 'required_mode', 'is_required', 'sort_order', 'passing_score', 'max_attempts']
    list_filter = ['curriculum', 'required_mode', 'is_required', 'lab__device']
    search_fields = ['curriculum__curriculum_code', 'curriculum__curriculum_name', 'lab__lab_id', 'lab__lab_name']
    list_select_related = ['curriculum', 'lab', 'lab__device']
    ordering = ['curriculum_id', 'sort_order', 'lab_id']


@admin.register(TrainingClass)
class TrainingClassAdmin(ReadOnlyAuditAdmin):
    list_display = [
'class_code', 'class_name', 'start_date', 'status',
        'active_member_count', 'assigned_lab_count', 'created_by',
    ]
    list_filter = ['status', 'is_mock', 'start_date', 'region', 'curriculum']
    search_fields = ['class_code', 'class_name', 'enrollments__user__employee_id', 'enrollments__user__email']
    list_select_related = ['created_by', 'instructor', 'region', 'curriculum']
    inlines = [ClassEnrollmentInline, ClassLabAssignmentInline]

    def get_queryset(self, request):
        today = timezone.localdate()
        now = timezone.now()
        return super().get_queryset(request).annotate(
            active_members=Count(
                'enrollments',
                filter=(
                    Q(enrollments__status='active', enrollments__is_mock=False)
                    & Q(enrollments__valid_from__lte=today)
                    & (Q(enrollments__valid_to__isnull=True) | Q(enrollments__valid_to__gte=today))
                    & Q(status__in=('planned', 'active'))
& Q(start_date__lte=today)
                ),
                distinct=True,
            ),
            assigned_labs=Count(
                'class_lab_assignments',
                filter=(
                    Q(class_lab_assignments__status__in=('assigned', 'active'))
                    & Q(class_lab_assignments__assigned_at__lte=now)
                    & (
                        Q(class_lab_assignments__due_at__isnull=True)
| Q(class_lab_assignments__due_at__gte=now)
                    )
                    & Q(status__in=('planned', 'active'))
                    & Q(start_date__lte=today)
                ),
                distinct=True,
            ),
        )

    @admin.display(description='Thành viên hiệu lực', ordering='active_members')
    def active_member_count(self, obj):
        return obj.active_members

    @admin.display(description='Bài đang hiệu lực', ordering='assigned_labs')
    def assigned_lab_count(self, obj):
        return obj.assigned_labs


@admin.register(ClassEnrollment)
class ClassEnrollmentAdmin(ReadOnlyAuditAdmin):
    list_display = ['training_class', 'user', 'valid_from', 'valid_to', 'status', 'assignment_count', 'passed_count', 'seed_batch']
    list_filter = ['status', 'is_mock', 'valid_from', 'training_class']
    search_fields = ['training_class__class_code', 'user__employee_id', 'user__email', 'source_class_code', 'seed_batch']
    list_select_related = ['training_class', 'user']

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            assignments=Count(
                'lab_assignments',
                filter=~Q(lab_assignments__status='waived'),
                distinct=True,
            ),
            passed_assignments=Count(
                'lab_assignments',
                filter=Q(lab_assignments__status='passed'),
                distinct=True,
            ),
        )

    @admin.display(description='Tổng bài giao', ordering='assignments')
    def assignment_count(self, obj):
        return obj.assignments

    @admin.display(description='Đã đạt', ordering='passed_assignments')
    def passed_count(self, obj):
        return obj.passed_assignments


@admin.register(ClassLabAssignment)
class ClassLabAssignmentAdmin(ReadOnlyAuditAdmin):
    list_display = ['training_class', 'lab_name', 'device_name', 'assigned_at', 'due_at', 'status', 'assignment_source']
    list_filter = ['status', 'assignment_source', 'training_class', 'curriculum_lab__lab__device']
    search_fields = ['training_class__class_code', 'curriculum_lab__lab__lab_id', 'curriculum_lab__lab__lab_name']
    list_select_related = ['training_class', 'curriculum_lab', 'curriculum_lab__lab', 'curriculum_lab__lab__device']

    @admin.display(description='Bài lab', ordering='curriculum_lab__lab__lab_name')
    def lab_name(self, obj):
        return obj.curriculum_lab.lab.lab_name

    @admin.display(description='Thiết bị', ordering='curriculum_lab__lab__device__device_name')
    def device_name(self, obj):
        return obj.curriculum_lab.lab.device.device_name


@admin.register(LabAssignment)
class LabAssignmentAdmin(ReadOnlyAuditAdmin):
    list_display = [
        'technician', 'training_class', 'lab_name', 'device_name',
        'reporting_region', 'reporting_branch', 'status',
        'assigned_at', 'due_at', 'first_pass_attempt_no', 'assignment_source',
    ]
    list_filter = [
        'status', 'assignment_source', 'is_inferred', 'class_snapshot',
        ('region_snapshot', admin.EmptyFieldListFilter),
        'curriculum_lab__lab__device',
    ]
    search_fields = [
        'enrollment__user__employee_id', 'enrollment__user__email',
        'enrollment__user__display_name', 'class_snapshot__class_code',
        'region_snapshot__region_code', 'region_snapshot__region_name',
        'unit_snapshot__unit_code', 'unit_snapshot__unit_name',
        'enrollment__user__region__region_code', 'enrollment__user__region__region_name',
        'enrollment__user__unit__unit_code', 'enrollment__user__unit__unit_name',
        'curriculum_lab__lab__lab_id', 'curriculum_lab__lab__lab_name',
    ]
    list_select_related = [
        'enrollment', 'enrollment__user', 'enrollment__user__unit',
        'enrollment__user__unit__region', 'class_snapshot', 'region_snapshot',
        'unit_snapshot', 'unit_snapshot__region', 'curriculum_lab',
        'curriculum_lab__lab', 'curriculum_lab__lab__device',
    ]
    date_hierarchy = 'assigned_at'
    ordering = ['-assigned_at', 'assignment_id']
    list_per_page = 100
    inlines = [AssignmentTimerSessionLinkInline]

    @admin.display(description='KTV', ordering='enrollment__user__display_name')
    def technician(self, obj):
        return obj.enrollment.user

    @admin.display(description='Lớp', ordering='class_snapshot__class_code')
    def training_class(self, obj):
        return obj.class_snapshot

    @admin.display(description='Vùng báo cáo', ordering='region_snapshot__region_code')
    def reporting_region(self, obj):
        region = obj.region_snapshot or (obj.enrollment.user.unit.region if obj.enrollment.user.unit_id else None)
        if not region:
            return '-'
        if obj.region_snapshot_id:
            return region
        return format_html(
            '{} <span title="Phân công thiếu snapshot; báo cáo đang dùng vùng hiện tại của KTV" '
            'style="color:#92400e;font-size:11px;">(vùng hiện tại)</span>',
            region,
        )

    @admin.display(description='Chi nhánh', ordering='unit_snapshot__unit_name')
    def reporting_branch(self, obj):
        unit = obj.unit_snapshot or obj.enrollment.user.unit
        return unit.unit_name if unit else '-'

    @admin.display(description='Bài lab', ordering='curriculum_lab__lab__lab_name')
    def lab_name(self, obj):
        return obj.curriculum_lab.lab.lab_name

    @admin.display(description='Thiết bị', ordering='curriculum_lab__lab__device__device_name')
    def device_name(self, obj):
        return obj.curriculum_lab.lab.device.device_name


@admin.register(AssignmentImportLog)
class AssignmentImportLogAdmin(ReadOnlyAuditAdmin):
    list_display = ['imported_at', 'batch_id', 'file_name', 'imported_by', 'class_count', 'member_count', 'device_count', 'assignment_count', 'error_count']
    search_fields = ['batch_id', 'file_name', 'imported_by__email', 'imported_by__employee_id']
    list_select_related = ['imported_by']


@admin.register(LoginLog)
class LoginLogAdmin(ReadOnlyAuditAdmin):
    list_display = [
        'created_at', 'event_type', 'user', 'employee_id', 'email', 'role',
        'ip_address',
    ]
    list_filter = ['event_type', 'role', 'created_at']
    search_fields = [
        'user__email', 'user__employee_id', 'employee_id', 'email',
        'display_name', 'iam_subject', 'ip_address',
    ]
    list_select_related = ['user']
    date_hierarchy = 'created_at'
    ordering = ['-created_at', '-id']
    list_per_page = 100


@admin.register(RosterImportLog)
class RosterImportLogAdmin(ReadOnlyAuditAdmin):
    list_display = [
        'imported_at', 'batch_id', 'file_name', 'imported_by', 'total_rows',
        'inserted', 'updated', 'terminated', 'reactivated', 'error_count',
    ]
    list_filter = ['imported_at']
    search_fields = [
        'batch_id', 'file_name', 'imported_by__email',
        'imported_by__employee_id',
    ]
    list_select_related = ['imported_by']
    date_hierarchy = 'imported_at'
    ordering = ['-imported_at', '-id']
    list_per_page = 100





# ===========================================================
# SchemaMigration Admin (read-only)
# ===========================================================

@admin.register(SchemaMigration)
class SchemaMigrationAdmin(admin.ModelAdmin):
    list_display = ['version', 'applied_at', 'execution_ms_badge']
    readonly_fields = ['version', 'checksum', 'execution_ms', 'applied_at']
    ordering = ['version']
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def execution_ms_badge(self, obj):
        ms = obj.execution_ms
        color = '#059669' if ms < 1000 else '#d97706' if ms < 5000 else '#dc2626'
        return format_html(
            '<span style="color:{};font-family:monospace;font-weight:600;">{} ms</span>',
            color, ms
        )
    execution_ms_badge.short_description = 'Thời gian chạy'
