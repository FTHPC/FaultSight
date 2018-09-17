Instructions for using FaultSite with Flipit:

1.) The files in this directory are partially taken from the `/scripts/analysis/` folder in FlipIt. Adjustments have been to the original files to make them more compatible with FaultSight.

2.) Modify the `analysis_config.py` such that it points to your FlipIt injection campaign. The file is already set up to use the example matrix-matrix multiplication data provided in the root `example_data` folder.

3.) Write your own custom `database.py` file, using the API calls provided in `databaseSetup.py`. This file is also already set up to use the example matrix-matrix multiplication data provided in the root `example_data` folder, so it would be good to use the existing code as a base for writing your custom `database.py` file. The readme provided at `databaseSetup/README.md` gives more detail about this step.

4.) Navigate to this directory, and generate the database via

```
python 'main.py'
```

5.) This will generate a database file `campaign.db` in this directory.  Copy this file to the `database` directory in FaultSight (`/faultSight/database`).

6.) Run FaultSight via

```
python run.py
```

from the root FaultSight directory. Refer to the main README instructions for further details on running FaultSight.
