
## Key Decisions and Why
- Keep the async background tasks insside of the BE webserver rather than
  a separate task service/deployment (e.g. celery) -- simpler, faster
- React/Python/SQLite stack (option B) -- I know it the best of all the 3
- Not thinking about database migration management (e.g. alembic)
- Testing confined to separate smoketests for BE and FE.
- Not worry about integration tests at this point.
- Not going to worry about Manual Triage record entry


## If I had one more day 
- I would create a proper async task management system (i.e. with Celery as worker stack and--locally--Redis as a queue
  or--remotely--SQS in AWS env.)
- build out the manual entry points on here (i.e. so that a human can manually triage a submission)
- Create a helm chart--even for local development--so that the remote deployment profile is more faithfully represented
  in local development (this assumes Kubernetes deployment in a remote env).
- Introduce proper migration management (i.e. Alembic)
- Swap out SQLite for Postgres (easy and simple...would've done this from the start but for the prompts request that I not do this).
- Swap out `pip` for `uv` on the python side.