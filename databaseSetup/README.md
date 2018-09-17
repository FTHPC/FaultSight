NOTE: If using FaultSight with FlipIt, please refer to the FlipIt-specific instructions provided in `databaseSetup/examples/FlipIt/README.md`


For setting up a database for FaultSight, use the API calls provided in `databaseSetup.py` to generate a sqlite3 database file.

The database contains five tables: `Sites`, `Trials`, `Injections`, `Signals`, and `Detections`. Writing a script for setting up the database should involve the following general steps:

1.) Create a new database file, or connect to an existing one.

2.) Add custom columns to one of the existing tables (if desired).

3.) Start trial

4.) Insert site information (if site information is known prior to inserting injections into database)

5.) Store injection campaign information. This involves storing injection, signal, and detection data.

6.) End trial. Repeat steps 3 - 6 for every trial in the injection campaign.

7.) Copy generated database file to `faultSight/database/` directory in FaultSight.
