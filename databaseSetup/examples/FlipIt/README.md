Instructions for using FaultSite with Flipit:


1.) Replace FlipIt's `/analysis/database.py` with the updated `database.py` in this directory. Additionally place `databaseSetup.py` in FlipIt's `/analysis/` directory.

2.) Modify FlipIt's `/analysis/analysis_config.py` according to your needs, `cd` to FlipIt's analysis directory, and generate the database via

```
python 'main.py'
```

3.) FlipIt will generate a database file `campaign.db` in the `/analysis` directory.  Copy this to the `database` directory in FaultSight (`/faultSight/database`).

4.) Refer to the main README for running FaultSight with this new database.
