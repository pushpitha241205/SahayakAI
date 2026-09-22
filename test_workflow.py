import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_full_workflow():
    print("=== STARTING SAHAYAK AI END-TO-END VERIFICATION ===")

    # 1. Test Root and Docs
    print("\n[1] Testing Static and Root Serving...")
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200, f"Root returned {r.status_code}"
    print("[OK] Landing page served successfully.")

    # 2. Test Admin Login (Pre-seeded)
    print("\n[2] Testing Admin Authentication...")
    admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@sahayak.ai",
        "password": "Admin@12345"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    print("[OK] Admin authentication passed. JWT received.")

    # 3. Test User Registration
    print("\n[3] Testing User Registration...")
    test_user_email = "tester_emergency@example.com"
    reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Arjun Sharma",
        "email": test_user_email,
        "phone": "9876543210",
        "password": "UserPass@123",
        "confirm_password": "UserPass@123"
    })
    if reg_res.status_code == 201:
        user_token = reg_res.json()["access_token"]
        print("[OK] New user registered successfully.")
    else:
        # If already exists from earlier test, log in
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user_email,
            "password": "UserPass@123"
        })
        assert login_res.status_code == 200
        user_token = login_res.json()["access_token"]
        print("[OK] User signed in successfully.")

    user_headers = {"Authorization": f"Bearer {user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Test Add Emergency Contact
    print("\n[4] Testing Emergency Contact Creation...")
    contact_res = requests.post(f"{BASE_URL}/api/contacts", headers=user_headers, json={
        "name": "Kavita Sharma",
        "phone": "9123456780",
        "relationship": "Parent"
    })
    assert contact_res.status_code == 201, f"Contact creation failed: {contact_res.text}"
    contact_id = contact_res.json()["id"]
    print(f"[OK] Emergency contact created (ID: {contact_id}).")

    # 5. Test AI Emergency Analysis (English & Telugu)
    print("\n[5] Testing AI Situational Analysis...")
    ai_eng = requests.post(f"{BASE_URL}/api/emergency/analyze", json={
        "description": "Severe vehicle collision on highway, car crash with trapped driver",
        "language": "en"
    })
    assert ai_eng.status_code == 200
    res_data = ai_eng.json()
    print(f"[OK] AI English analysis: Type='{res_data['emergency_type']}', Severity='{res_data['severity']}'")
    assert res_data["emergency_type"] == "Accident"
    assert res_data["severity"] in ["HIGH", "CRITICAL"]

    ai_te = requests.post(f"{BASE_URL}/api/emergency/analyze", json={
        "description": "accident vehicle collision",
        "language": "te"
    })
    assert ai_te.status_code == 200
    res_te = ai_te.json()
    print(f"[OK] AI analysis: Type='{res_te['emergency_type']}', Severity='{res_te['severity']}'")

    # 6. Test Triggering SOS Emergency
    print("\n[6] Testing SOS Activation...")
    sos_res = requests.post(f"{BASE_URL}/api/emergency/create", headers=user_headers, json={
        "description": "Severe motorcycle accident on highway, rider has a leg fracture and bleeding heavily",
        "latitude": 17.385044,
        "longitude": 78.486671
    })
    assert sos_res.status_code == 201, f"SOS trigger failed: {sos_res.text}"
    sos_data = sos_res.json()
    emergency_id = sos_data["emergency_id"]
    print(f"[OK] SOS activated (ID: {emergency_id}). Notified {sos_data['notifications_sent']} contacts.")
    print(f"[OK] Nearby emergency stations identified: {len(sos_data['nearby_services'])}")

    # 7. Check User Incident History
    print("\n[7] Testing Incident History Retrieval...")
    hist_res = requests.get(f"{BASE_URL}/api/incidents", headers=user_headers)
    assert hist_res.status_code == 200
    incidents = hist_res.json()
    assert len(incidents) >= 1
    print(f"[OK] Found {len(incidents)} incidents in user log.")

    # 8. Check Admin Statistics & Incident Feed
    print("\n[8] Testing Admin Oversight Dashboard APIs...")
    stats_res = requests.get(f"{BASE_URL}/api/admin/statistics", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(f"[OK] Admin Stats: Users={stats['total_users']}, Active SOS={stats['active_emergencies']}, Total={stats['total_emergencies']}")

    admin_em_res = requests.get(f"{BASE_URL}/api/admin/emergencies", headers=admin_headers)
    assert admin_em_res.status_code == 200
    print(f"[OK] Admin Emergency Feed returned {len(admin_em_res.json())} entries.")

    # 9. Test Resolving Emergency
    print("\n[9] Testing Resolving Emergency (Marking Safe)...")
    resolve_res = requests.put(f"{BASE_URL}/api/emergency/{emergency_id}/resolve", headers=user_headers, json={
        "resolution_notes": "Ambulance arrived, user safe."
    })
    assert resolve_res.status_code == 200
    print("[OK] Emergency successfully marked as RESOLVED.")

    print("\n=======================================================")
    print("   ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)   ")
    print("=======================================================")

if __name__ == "__main__":
    try:
        test_full_workflow()
    except Exception as e:
        print(f"Error during verification: {e}")
        sys.exit(1)
