Instructions for using FaultSite with Flipit:

1.) The files in this directory are taken from the `/scripts/analysis/` folder in FlipIt. I have made some small adjustments to these analysis files to make them compatible with FaultSight.

2.) Modify the `analysis_config.py` such that it points to the FlipIt injection campaign.

3.) Navigate to this directory, and generate the database via

```
python 'main.py'
```

3.) This will generate a database file `campaign.db` in this directory.  Copy this to the `database` directory in FaultSight (`/faultSight/database`).

4.) Refer to the main README instructions for running FaultSight with this new database.
