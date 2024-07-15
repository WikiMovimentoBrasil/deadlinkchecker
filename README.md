# Dead link checker
An app that checks for deadlinks on Wikipedia. its is currently deployed at https://deadlinkchecker.toolforge.org/ <br>
The documentation of the tool is available on Meta at https://meta.wikimedia.org/wiki/Dead_Link_Checker

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
python -m venv venv
```
4. Activate the virtual environmeny
```
.\venv\Scripts\activate
```
5. Install project dependencies
```
pip install -r requirements.txt
```
6. create a `.env` file in the root of your project and add to it the following variables
```
SOCIAL_AUTH_MEDIAWIKI_KEY= Your oauth key from the oauth consumer registration
SOCIAL_AUTH_MEDIAWIKI_SECRET= Your oauth secret from the oauth consumer registration
SOCIAL_AUTH_MEDIAWIKI_URL=https://meta.wikimedia.org/w/index.php
SESSION_SECRET= a randomly generated secret value
TOOL_TOOLSDB_USER= Tools database user
TOOL_TOOLSDB_PASSWORD= Tools database secret
REDIS_URL= Redis URL
REDIS_PREFIX= Redis key prefix
```
7. Start the app in development
```
uvicorn app:app --reload
```
