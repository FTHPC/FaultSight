Instructions for using FaultSite with Flipit:


1.) Replace `database.py` in FlipIt's `/analysis/database.py` with the `database.py` in this directory. Additionally place `databaseSetup.py` in FlipIt's `/analysis/` directory.

2.) Modify FlipIt's `/analysis/analysis_config.py` according to your needs, and generate the database via

```
python 'main.py'
```

3.) Copy generated database file (`campaign.db`) to the `database` directory in FaultSight.
