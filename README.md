# Dead link checker
An app that checks for deadlinks on Wikipedia. its is currently deployed at https://deadlinkchecker.toolforge.org/

## Getting started:
1. Clone the repository
```
git clone https://github.com/WikiMovimentoBrasil/deadlinkchecker.git
```
2. Enter the project directory
```
cd deadlinkchecker
```
3. Create a virtual environment
```
pythom -m venv venv
```
4. Activate the virtual environmeny
```
.\venv\Scripts\activate
```
5. Install project dependencies
```
pip install -r requirements.txt
```
6. Start the app in development
```
uvicorn app:app --reload
```