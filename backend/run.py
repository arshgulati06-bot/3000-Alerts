import os
import sys
from pathlib import Path
import uvicorn

# Ensure the project root directory is in the Python module search path
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    reload = os.getenv("APP_ENV", "development").lower() == "development"

    print(f"[*] Starting Sworders SOC API on http://{host}:{port}")
    print(f"[*] Interactive Swagger Docs: http://localhost:{port}/docs")
    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        reload=reload,
    )
