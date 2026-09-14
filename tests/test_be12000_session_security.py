from simulators.sim_be12000.src.session import Session


def test_be12000_session_rejects_non_current_tokens_after_login():
    session = Session("admin", "admin")
    session.da_dang_nhap = True

    current_token = session.sess_token
    assert session.kiem_token(current_token)
    assert not session.kiem_token("not-the-current-token")

    replacement_token = session.doi_token()
    assert replacement_token != current_token
    assert session.kiem_token(replacement_token)
    assert not session.kiem_token(current_token)
