
## Key Decisions and Why
- Keep the async background tasks insside of the BE webserver rather than
  a separate task service/deployment (e.g. celery) -- simpler, faster
- React/Python/SQLite stack (option B) -- I know it the best of all the 3
- Not thinking about database migration management (e.g. alembic)
- Testing confined to smoketests for BE and FE
- Not worry about integration tests at this point
- Not going to worry about Manual Triage record entry -- but this


## If I had one more day 
- I would create a proper async task management system
- build out the manual entry points on here