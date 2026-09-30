import subprocess
import sys
import time
import os
import signal

def run():
    print("=" * 70)
    print("PAIMANA Pulse: From project monitoring to proactive intervention")
    print("Ministry of Statistics and Programme Implementation (MoSPI)")
    print("Smart India Hackathon 2026 • Problem Statement ID: 26103")
    print("=" * 70)

    # 1. Start Backend on port 8000
    print("\n[1/2] Starting PAIMANA Pulse FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )

    # Allow backend 2 seconds to initialize SQLite and verify tables
    time.sleep(2)

    # 2. Start Frontend on port 5173
    print("\n[2/2] Starting PAIMANA Pulse React Frontend on http://localhost:5173 ...")
    frontend_cwd = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    frontend_proc = subprocess.Popen(
        ["npm.cmd", "run", "dev", "--", "--host", "127.0.0.1"],
        cwd=frontend_cwd
    )

    print("\n" + "=" * 70)
    print("PAIMANA Pulse is now running live!")
    print("Frontend URL: http://localhost:5173")
    print("Backend API & Docs: http://127.0.0.1:8000/docs")
    print("Hero Project Demonstration: P10291")
    print("Press Ctrl+C to terminate both servers.")
    print("=" * 70 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down PAIMANA Pulse services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print("All processes closed cleanly.")

if __name__ == "__main__":
    run()
