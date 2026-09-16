"""
Django models cho FTC Admin Portal.

QUAN TRỌNG: TẤT CẢ models đều có `managed = False` (Meta.managed = False).
Django sẽ KHÔNG tạo, xóa hay thay đổi các bảng này qua migrations.
Models phản chiếu chính xác schema PostgreSQL thực tế trên database Neon.
"""
import uuid
from django.db import models


# ===========================================================
# Device & Lab Catalog
# ===========================================================

class DeviceCatalog(models.Model):
    device_id = models.CharField(max_length=50, primary_key=True, verbose_name='Mã thiết bị')
    model = models.CharField(max_length=100, blank=True, null=True, verbose_name='Model')
    device_name = models.CharField(max_length=100, unique=True, verbose_name='Tên thiết bị')
    is_active = models.BooleanField(default=True, verbose_name='Hoạt động')
    sort_order = models.IntegerField(default=0, verbose_name='Thứ tự')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'device_catalog'
        ordering = ['sort_order', 'device_name']
        verbose_name = 'device_catalog'
        verbose_name_plural = 'device_catalog'

    def __str__(self):
        return f"{self.device_name} ({self.device_id})"


class LabCatalog(models.Model):
    lab_id = models.CharField(max_length=50, primary_key=True, verbose_name='Mã bài lab')
    device = models.ForeignKey(
        DeviceCatalog,
        on_delete=models.CASCADE,
        to_field='device_id',
        db_column='device_id',
        related_name='labs',
        verbose_name='Thiết bị',
    )
    lab_name = models.CharField(max_length=150, verbose_name='Tên bài lab')
    is_active = models.BooleanField(default=True, verbose_name='Hoạt động')
    sort_order = models.IntegerField(default=0, verbose_name='Thứ tự')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'lab_catalog'
        ordering = ['device_id', 'sort_order']
        verbose_name = 'lab_catalog'
        verbose_name_plural = 'lab_catalog'

    def __str__(self):
        return f"{self.lab_name} [{self.lab_id}]"


# ===========================================================
# Application roles
# ===========================================================

class Role(models.Model):
    role_code = models.CharField(max_length=20, primary_key=True, verbose_name='Mã role')
    role_name = models.CharField(max_length=100, verbose_name='Tên role')
    is_admin = models.BooleanField(default=False, verbose_name='Quyền quản trị')
    can_export_reports = models.BooleanField(default=False, verbose_name='Được xuất báo cáo')
    sort_order = models.SmallIntegerField(default=0, verbose_name='Thứ tự')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'roles'
        ordering = ['sort_order', 'role_code']
        verbose_name = 'role'
        verbose_name_plural = 'roles'

    def __str__(self):
        return f"{self.role_name} ({self.role_code})"


# ===========================================================
# User (ánh xạ bảng users của hệ thống IAM/PHP)
# ===========================================================

class FtcUser(models.Model):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, verbose_name='User ID')
    email = models.EmailField(unique=True, max_length=254, verbose_name='Email')
    display_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Tên hiển thị')
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        to_field='role_code',
        db_column='role',
        related_name='users',
        default='KTV',
        verbose_name='Vai trò',
    )
    employee_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='Mã nhân viên')
    job_title = models.CharField(max_length=200, blank=True, null=True, verbose_name='Chức danh')
    unit_code = models.CharField(max_length=100, blank=True, null=True, verbose_name='Mã đơn vị')
    unit_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Tên đơn vị')
    unit = models.ForeignKey(
        'OrgUnit',
        on_delete=models.PROTECT,
        null=True, blank=True,
        to_field='unit_id',
        db_column='unit_id',
        related_name='users',
        verbose_name='Đơn vị hiện tại',
    )
    region_code = models.CharField(max_length=80, blank=True, null=True, verbose_name='Mã khu vực')
    dashboard_region = models.CharField(max_length=200, blank=True, null=True, verbose_name='Khu vực dashboard')
    region = models.ForeignKey(
        'Region',
        on_delete=models.PROTECT,
        null=True, blank=True,
        to_field='region_id',
        db_column='region_id',
        related_name='users',
        verbose_name='Khu vực/chi nhánh hiện tại',
    )
    class_code = models.CharField(
        max_length=50, blank=True, null=True,
        verbose_name='Mã lớp nguồn (legacy, không dùng cho báo cáo)',
    )
    training_start_date = models.DateField(blank=True, null=True, verbose_name='Bắt đầu đào tạo')
    training_end_date = models.DateField(blank=True, null=True, verbose_name='Kết thúc đào tạo')
    is_terminated = models.BooleanField(default=False, verbose_name='Đã nghỉ việc')
    termination_date = models.DateField(blank=True, null=True, verbose_name='Ngày nghỉ việc')
    termination_reason = models.TextField(blank=True, null=True, verbose_name='Lý do nghỉ việc')
    employee_source = models.CharField(max_length=200, blank=True, null=True, verbose_name='Nguồn dữ liệu')
    employee_seed_batch = models.CharField(max_length=160, blank=True, null=True, verbose_name='Batch seed')
    employee_synced_at = models.DateTimeField(blank=True, null=True, verbose_name='Đồng bộ lúc')
    last_login_at = models.DateTimeField(blank=True, null=True, verbose_name='Lần đăng nhập cuối')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = 'users'
        verbose_name_plural = 'users'

    def __str__(self):
        return f"{self.display_name or self.email} ({self.employee_id or '—'})"


class Curriculum(models.Model):
    curriculum_id = models.UUIDField(primary_key=True, default=uuid.uuid4, verbose_name='ID chương trình')
    curriculum_code = models.CharField(max_length=80, verbose_name='Mã chương trình')
    version = models.CharField(max_length=30, verbose_name='Phiên bản')
    curriculum_name = models.TextField(verbose_name='Tên chương trình')
    description = models.TextField(blank=True, null=True, verbose_name='Mô tả')
    status = models.CharField(max_length=20, verbose_name='Trạng thái')
    is_default = models.BooleanField(default=False, verbose_name='Mặc định')
    effective_from = models.DateField(blank=True, null=True, verbose_name='Hiệu lực từ')
    effective_to = models.DateField(blank=True, null=True, verbose_name='Hiệu lực đến')
    created_at = models.DateTimeField(verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'curricula'
        ordering = ['curriculum_code', '-version']
        verbose_name = 'Chương trình đào tạo'
        verbose_name_plural = 'Chương trình đào tạo'

    def __str__(self):
        return f"{self.curriculum_code} v{self.version}"


class CurriculumLab(models.Model):
    curriculum_lab_id = models.UUIDField(primary_key=True, default=uuid.uuid4, verbose_name='ID bài trong chương trình')
    curriculum = models.ForeignKey(
        Curriculum, on_delete=models.PROTECT, to_field='curriculum_id', db_column='curriculum_id',
        related_name='curriculum_labs', verbose_name='Chương trình',
    )
    lab = models.ForeignKey(
        LabCatalog, on_delete=models.PROTECT, to_field='lab_id', db_column='lab_id',
        related_name='curriculum_entries', verbose_name='Bài lab',
    )
    required_mode = models.CharField(max_length=20, verbose_name='Chế độ yêu cầu')
    is_required = models.BooleanField(default=True, verbose_name='Bắt buộc')
    sort_order = models.IntegerField(default=0, verbose_name='Thứ tự')
    available_offset_days = models.IntegerField(default=0, verbose_name='Mở sau (ngày)')
    due_offset_days = models.IntegerField(blank=True, null=True, verbose_name='Hạn sau (ngày)')
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name='Điểm đạt')
    max_attempts = models.IntegerField(blank=True, null=True, verbose_name='Số lần tối đa')
    created_at = models.DateTimeField(verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'curriculum_labs'
        ordering = ['curriculum_id', 'sort_order', 'lab_id']
        verbose_name = 'Bài lab trong chương trình'
        verbose_name_plural = 'Bài lab trong chương trình'

    def __str__(self):
        return f"{self.curriculum} · {self.lab}"


class TrainingClass(models.Model):
    class_id = models.UUIDField(primary_key=True, default=uuid.uuid4, verbose_name='ID lớp')
    class_code = models.CharField(max_length=50, unique=True, verbose_name='Mã lớp')
    class_name = models.TextField(verbose_name='Tên lớp')
    region_name = models.CharField(max_length=50, verbose_name='Khu vực lớp')
    region = models.ForeignKey(
        'Region', on_delete=models.PROTECT, null=True, blank=True,
        to_field='region_id', db_column='region_id', related_name='training_classes',
        verbose_name='Khu vực chuẩn',
    )
    curriculum = models.ForeignKey(
        Curriculum, on_delete=models.PROTECT, null=True, blank=True,
        to_field='curriculum_id', db_column='curriculum_id', related_name='training_classes',
        verbose_name='Chương trình',
    )
    start_date = models.DateField(verbose_name='Hiệu lực từ')
    capacity = models.IntegerField(blank=True, null=True, verbose_name='Sức chứa')
    status = models.CharField(max_length=20, verbose_name='Trạng thái')
    instructor = models.ForeignKey(
        FtcUser, on_delete=models.SET_NULL, null=True, blank=True,
        to_field='user_id', db_column='instructor_user_id', related_name='instructed_training_classes',
        verbose_name='Giảng viên',
    )
    created_by = models.ForeignKey(
        FtcUser, on_delete=models.SET_NULL, null=True, blank=True,
        to_field='user_id', db_column='created_by', related_name='created_training_classes',
        verbose_name='Người tạo',
    )
    description = models.TextField(blank=True, null=True, verbose_name='Mô tả')
    is_mock = models.BooleanField(default=False, verbose_name='Dữ liệu Test')
    seed_batch = models.CharField(max_length=100, blank=True, null=True, verbose_name='Batch seed')
    created_at = models.DateTimeField(verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'training_classes'
        ordering = ['-start_date', '-class_code']
        verbose_name = 'training_classes'
        verbose_name_plural = 'training_classes'

    def __str__(self):
        return f"{self.class_code} - {self.class_name}"


class ClassEnrollment(models.Model):
    enrollment_id = models.BigAutoField(primary_key=True, verbose_name='ID xếp lớp')
    training_class = models.ForeignKey(
        TrainingClass, on_delete=models.PROTECT, to_field='class_id', db_column='class_id',
        related_name='enrollments', verbose_name='Lớp',
    )
    user = models.ForeignKey(
        FtcUser, on_delete=models.PROTECT, to_field='user_id', db_column='user_id',
        related_name='class_enrollments', verbose_name='KTV',
    )
    status = models.CharField(max_length=20, verbose_name='Trạng thái')
    source_class_code = models.CharField(max_length=50, blank=True, null=True, verbose_name='Mã lớp nguồn')
    valid_from = models.DateField(verbose_name='Hiệu lực từ')
    valid_to = models.DateField(blank=True, null=True, verbose_name='Hiệu lực đến')
    is_mock = models.BooleanField(default=False, verbose_name='Dữ liệu Test')
    seed_batch = models.CharField(max_length=100, blank=True, null=True, verbose_name='Nguồn tạo')
    created_at = models.DateTimeField(verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'class_enrollments'
        ordering = ['-valid_from', '-enrollment_id']
        verbose_name = 'class_enrollments'
        verbose_name_plural = 'class_enrollments'

    def __str__(self):
        return f"{self.training_class.class_code} · {self.user}"


class ClassLabAssignment(models.Model):
    class_lab_assignment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, verbose_name='ID giao bài lớp')
    training_class = models.ForeignKey(
        TrainingClass, on_delete=models.PROTECT, to_field='class_id', db_column='class_id',
        related_name='class_lab_assignments', verbose_name='Lớp',
    )
    curriculum_lab = models.ForeignKey(
        CurriculumLab, on_delete=models.PROTECT, to_field='curriculum_lab_id', db_column='curriculum_lab_id',
        related_name='class_assignments', verbose_name='Bài lab',
    )
    assigned_at = models.DateTimeField(verbose_name='Giao lúc')
    due_at = models.DateTimeField(blank=True, null=True, verbose_name='Hạn hoàn thành')
    status = models.CharField(max_length=20, verbose_name='Trạng thái')
    assignment_source = models.CharField(max_length=30, verbose_name='Nguồn giao')
    is_inferred = models.BooleanField(default=False, verbose_name='Suy diễn')
    created_at = models.DateTimeField(verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'class_lab_assignments'
        ordering = ['training_class_id', 'curriculum_lab__sort_order']
        verbose_name = 'Bài giao cho lớp'
        verbose_name_plural = 'Bài giao cho lớp'

    def __str__(self):
        return f"{self.training_class.class_code} · {self.curriculum_lab.lab.lab_name}"


class LabAssignment(models.Model):
    assignment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, verbose_name='ID phân công')
    enrollment = models.ForeignKey(
        ClassEnrollment, on_delete=models.PROTECT, to_field='enrollment_id', db_column='enrollment_id',
        related_name='lab_assignments', verbose_name='Xếp lớp',
    )
    class_lab_assignment = models.ForeignKey(
        ClassLabAssignment, on_delete=models.PROTECT, null=True, blank=True,
        to_field='class_lab_assignment_id', db_column='class_lab_assignment_id',
        related_name='member_assignments', verbose_name='Bài giao cấp lớp',
    )
    curriculum_lab = models.ForeignKey(
        CurriculumLab, on_delete=models.PROTECT, to_field='curriculum_lab_id', db_column='curriculum_lab_id',
        related_name='member_assignments', verbose_name='Bài lab',
    )
    assigned_at = models.DateTimeField(verbose_name='Giao lúc')
    due_at = models.DateTimeField(blank=True, null=True, verbose_name='Hạn hoàn thành')
    status = models.CharField(max_length=20, verbose_name='Trạng thái')
    first_pass_attempt_no = models.IntegerField(blank=True, null=True, verbose_name='Lần đạt đầu tiên')
    first_try_evidence = models.CharField(max_length=24, verbose_name='Chứng cứ lần đầu')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Hoàn thành lúc')
    passed_at = models.DateTimeField(blank=True, null=True, verbose_name='Đạt lúc')
    region_snapshot = models.ForeignKey(
        'Region', on_delete=models.PROTECT, null=True, blank=True,
        to_field='region_id', db_column='region_id_snapshot', related_name='lab_assignment_snapshots',
        verbose_name='Khu vực lúc giao',
    )
    unit_snapshot = models.ForeignKey(
        'OrgUnit', on_delete=models.PROTECT, null=True, blank=True,
        to_field='unit_id', db_column='unit_id_snapshot', related_name='lab_assignment_snapshots',
        verbose_name='Đơn vị lúc giao',
    )
    class_snapshot = models.ForeignKey(
        TrainingClass, on_delete=models.PROTECT, to_field='class_id', db_column='class_id_snapshot',
        related_name='member_lab_assignments', verbose_name='Lớp lúc giao',
    )
    assignment_source = models.CharField(max_length=30, verbose_name='Nguồn giao')
    is_inferred = models.BooleanField(default=False, verbose_name='Suy diễn')
    created_at = models.DateTimeField(verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'lab_assignments'
        ordering = ['-assigned_at', 'assignment_id']
        verbose_name = 'Bài giao cho KTV'
        verbose_name_plural = 'Bài giao cho KTV'

    def __str__(self):
        return f"{self.enrollment.user} · {self.curriculum_lab.lab.lab_name}"


class AssignmentImportLog(models.Model):
    id = models.BigAutoField(primary_key=True, verbose_name='ID import')
    batch_id = models.CharField(max_length=100, unique=True, verbose_name='Mã batch')
    imported_by = models.ForeignKey(
        FtcUser, on_delete=models.SET_NULL, null=True, blank=True,
        to_field='user_id', db_column='imported_by', related_name='assignment_imports',
        verbose_name='Người import',
    )
    file_name = models.TextField(blank=True, null=True, verbose_name='Tên file')
    class_count = models.IntegerField(default=0, verbose_name='Số lớp')
    member_count = models.IntegerField(default=0, verbose_name='Số thành viên')
    device_count = models.IntegerField(default=0, verbose_name='Số thiết bị')
    assignment_count = models.IntegerField(default=0, verbose_name='Bài giao mới')
    error_count = models.IntegerField(default=0, verbose_name='Số lỗi')
    error_details = models.JSONField(default=list, verbose_name='Chi tiết lỗi')
    imported_at = models.DateTimeField(verbose_name='Thời điểm import')

    class Meta:
        managed = False
        db_table = 'assignment_import_log'
        ordering = ['-imported_at', '-id']
        verbose_name = 'assignment_import_log'
        verbose_name_plural = 'assignment_import_log'


# ===========================================================
# Timer Sessions (PK là bigint id)
# ===========================================================

class TimerSession(models.Model):
    id = models.BigAutoField(primary_key=True, verbose_name='ID Phiên')
    user = models.ForeignKey(
        FtcUser,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        to_field='user_id',
        db_column='user_id',
        related_name='timer_sessions',
        verbose_name='KTV',
    )
    technician_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='Mã KTV')
    name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Tên')
    email = models.CharField(max_length=255, blank=True, null=True, verbose_name='Email')
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='Bắt đầu')
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name='Kết thúc')
    duration_sec = models.IntegerField(null=True, blank=True, default=0, verbose_name='Thời gian (giây)')
    mode = models.CharField(
        max_length=30,
        choices=[('Thực hành', 'Thực hành'), ('Hướng dẫn', 'Hướng dẫn')],
        default='Thực hành',
        verbose_name='Chế độ',
    )
    # `device` is the historical display-name snapshot. `device_id` is the
    # canonical, database-enforced relationship to device_catalog.
    device_name_snapshot = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        db_column='device',
        verbose_name='Tên thiết bị lúc ghi nhận',
    )
    device = models.ForeignKey(
        DeviceCatalog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        to_field='device_id',
        db_column='device_id',
        related_name='timer_sessions',
        verbose_name='Thiết bị danh mục',
    )
    # lab_id and lab_name are historical values. PostgreSQL does not currently
    # enforce a lab_catalog FK, so do not expose a relation the database lacks.
    lab_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='Lab ID')
    lab_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='Tên bài lab')
    session_type = models.CharField(max_length=30, default='practice', verbose_name='Loại phiên')
    status = models.CharField(
        max_length=30,
        choices=[
            ('completed', 'Hoàn thành'),
            ('failed', 'Không đạt'),
            ('abandoned', 'Bỏ dở'),
            ('in_progress', 'Đang thực hiện'),
        ],
        default='completed',
        verbose_name='Trạng thái',
    )
    completed_first_try = models.BooleanField(null=True, blank=True, verbose_name='Đạt lần đầu')
    practice_attempt_no = models.IntegerField(null=True, blank=True, verbose_name='Số lượt thực hành')
    attempt_sequence_complete = models.BooleanField(default=True, verbose_name='Đủ chuỗi lần thử')
    last_action = models.TextField(blank=True, null=True, verbose_name='Hành động cuối')
    is_passed = models.BooleanField(null=True, blank=True, verbose_name='Đạt yêu cầu')
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='Điểm số')
    grading_details = models.JSONField(null=True, blank=True, verbose_name='Chi tiết chấm điểm')
    client_ip = models.CharField(max_length=50, blank=True, null=True, verbose_name='IP máy KTV')
    user_agent = models.TextField(blank=True, null=True, verbose_name='User Agent')
    is_mock = models.BooleanField(default=False, verbose_name='Dữ liệu Test')
    seed_batch = models.CharField(max_length=160, blank=True, null=True, verbose_name='Batch Seed')
    seed_key = models.CharField(max_length=200, blank=True, null=True, verbose_name='Khóa dữ liệu nguồn')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')

    class Meta:
        managed = False
        db_table = 'timer_sessions'
        ordering = ['-finished_at', '-id']
        verbose_name = 'timer_sessions'
        verbose_name_plural = 'timer_sessions'

    def __str__(self):
        return f"Session #{self.id} - {self.name or self.email} ({self.lab_name})"


class TimerSessionAssignmentLink(models.Model):
    pk = models.CompositePrimaryKey('timer_session', 'assignment')
    timer_session = models.ForeignKey(
        TimerSession, on_delete=models.CASCADE, to_field='id', db_column='timer_session_id',
        related_name='assignment_links', verbose_name='Phiên thực hành',
    )
    assignment = models.ForeignKey(
        LabAssignment, on_delete=models.PROTECT, to_field='assignment_id', db_column='assignment_id',
        related_name='timer_session_links', verbose_name='Phân công',
    )
    link_source = models.CharField(max_length=30, verbose_name='Nguồn liên kết')
    linked_at = models.DateTimeField(verbose_name='Liên kết lúc')

    class Meta:
        managed = False
        db_table = 'timer_session_assignment_links'
        ordering = ['-linked_at', 'timer_session_id', 'assignment_id']
        verbose_name = 'Liên kết phiên–phân công'
        verbose_name_plural = 'Liên kết phiên–phân công'

    def __str__(self):
        return f"Session #{self.timer_session_id} · {self.assignment_id}"


# ===========================================================
# Region
# ===========================================================

class Region(models.Model):
    region_id = models.UUIDField(primary_key=True, default=uuid.uuid4, verbose_name='Region ID')
    region_code = models.CharField(max_length=80, unique=True, verbose_name='Mã khu vực')
    region_name = models.TextField(verbose_name='Tên khu vực')
    branch_name = models.TextField(blank=True, null=True, verbose_name='Tên chi nhánh')
    dashboard_group = models.CharField(max_length=100, blank=True, null=True, verbose_name='Nhóm Dashboard')
    is_active = models.BooleanField(default=True, verbose_name='Hoạt động')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'regions'
        ordering = ['region_code']
        verbose_name = 'regions'
        verbose_name_plural = 'regions'

    def __str__(self):
        return f"{self.region_name} ({self.region_code})"


class OrgUnit(models.Model):
    unit_id = models.UUIDField(primary_key=True, default=uuid.uuid4, verbose_name='Unit ID')
    region = models.ForeignKey(
        Region, on_delete=models.PROTECT, to_field='region_id', db_column='region_id',
        related_name='org_units', verbose_name='Khu vực',
    )
    unit_code = models.CharField(max_length=100, unique=True, verbose_name='Mã đơn vị')
    unit_name = models.TextField(verbose_name='Tên đơn vị/chi nhánh')
    is_active = models.BooleanField(default=True, verbose_name='Hoạt động')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật')

    class Meta:
        managed = False
        db_table = 'org_units'
        ordering = ['region__region_name', 'unit_name', 'unit_code']
        verbose_name = 'đơn vị'
        verbose_name_plural = 'đơn vị'

    def __str__(self):
        return f"{self.unit_name} ({self.region.region_name})"


# ===========================================================
# Audit logs with user relationships
# ===========================================================

class LoginLog(models.Model):
    id = models.BigAutoField(primary_key=True, verbose_name='ID đăng nhập')
    created_at = models.DateTimeField(verbose_name='Thời điểm')
    event_type = models.TextField(verbose_name='Loại sự kiện')
    employee_id = models.TextField(blank=True, null=True, verbose_name='Mã nhân viên lúc đăng nhập')
    display_name = models.TextField(blank=True, null=True, verbose_name='Tên lúc đăng nhập')
    email = models.TextField(blank=True, null=True, verbose_name='Email lúc đăng nhập')
    role = models.TextField(blank=True, null=True, verbose_name='Vai trò lúc đăng nhập')
    iam_subject = models.TextField(blank=True, null=True, verbose_name='IAM subject')
    ip_address = models.TextField(blank=True, null=True, verbose_name='Địa chỉ IP')
    user_agent = models.TextField(blank=True, null=True, verbose_name='User Agent')
    session_id_hash = models.TextField(blank=True, null=True, verbose_name='Mã băm phiên')
    user = models.ForeignKey(
        FtcUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        to_field='user_id',
        db_column='user_id',
        related_name='login_logs',
        verbose_name='Người dùng',
    )

    class Meta:
        managed = False
        db_table = 'login_logs'
        ordering = ['-created_at', '-id']
        verbose_name = 'login_logs'
        verbose_name_plural = 'login_logs'

    def __str__(self):
        return f"Login #{self.id} - {self.email or self.employee_id or '—'}"


class RosterImportLog(models.Model):
    id = models.BigAutoField(primary_key=True, verbose_name='ID import')
    batch_id = models.CharField(max_length=100, unique=True, verbose_name='Mã batch')
    imported_by = models.ForeignKey(
        FtcUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        to_field='user_id',
        db_column='imported_by',
        related_name='roster_imports',
        verbose_name='Người import',
    )
    file_name = models.TextField(blank=True, null=True, verbose_name='Tên file')
    total_rows = models.IntegerField(default=0, verbose_name='Tổng số dòng')
    inserted = models.IntegerField(default=0, verbose_name='Thêm mới')
    updated = models.IntegerField(default=0, verbose_name='Cập nhật')
    terminated = models.IntegerField(default=0, verbose_name='Nghỉ việc')
    reactivated = models.IntegerField(default=0, verbose_name='Kích hoạt lại')
    error_count = models.IntegerField(default=0, verbose_name='Số lỗi')
    error_details = models.JSONField(default=list, verbose_name='Chi tiết lỗi')
    imported_at = models.DateTimeField(verbose_name='Thời điểm import')

    class Meta:
        managed = False
        db_table = 'roster_import_log'
        ordering = ['-imported_at', '-id']
        verbose_name = 'roster_import_log'
        verbose_name_plural = 'roster_import_log'

    def __str__(self):
        return f"Import {self.batch_id}"


# ===========================================================
# Schema Migrations (read-only)
# ===========================================================

class SchemaMigration(models.Model):
    version = models.CharField(max_length=255, primary_key=True, verbose_name='Phiên bản')
    checksum = models.CharField(max_length=64, verbose_name='Mã kiểm tra Checksum')
    execution_ms = models.IntegerField(verbose_name='Thời gian thực thi (ms)')
    applied_at = models.DateTimeField(verbose_name='Thời điểm áp dụng')

    class Meta:
        managed = False
        db_table = 'schema_migrations'
        ordering = ['version']
        verbose_name = 'schema_migrations'
        verbose_name_plural = 'schema_migrations'

    def __str__(self):
        return self.version
