import sqlite3, os, sys


# API Calls - Wrappers to SQL queries
#
# Setup - Connect/Create a database
#   connect_to_existing(database_directory)
#   create_and_connect_database(database_directory)
#
#
# Add custom columns to tables
#   extend_sites_table(db_connection, column_name, column_type, default_value = None)
#   extend_trial_table(db_connection, column_name, column_type, default_value = None)
#   extend_injections_table(db_connection, column_name, column_type, default_value = None)
#   extend_signals_table(db_connection, column_name, column_type, default_value = None)
#   extend_detections_table(db_connection, column_name, column_type, default_value = None)
#
#
# Insert sites - Only if site information is known prior to inserting injections into database
#   insert_site(db_connection, row_arguments)
#
# Check site has been inserted previously and return site dictionary
#   check_site_exists(db_connection, site)
#
# Manually update site information (If sites inserted using insert_site())
#   update_site_type(db_connection, site, type)
#   update_site_comment(db_connection, site, comment):
#   update_site_location(db_connection, site, file = "", func = "", line = ""):
#   update_site_opcode(db_connection, site, opcode):
#   update_site_num_executions(db_connection, site, num_executions):
#   update_site_custom_field(db_connection, site, field, value)
#
#
#
# Start storing injection campaign information for a specific trial.
#   start_trial(db_connection, row_arguments)
#
#
# Insert injection campaign information
#
#   insert_injection(db_connection, row_arguments, site_arguments = {})
#   insert_signal(db_connection, row_arguments, has_crashed)
#   insert_detection(db_connection, row_arguments)
#
# Manually update current trial information
#   update_trial_num_inj(db_connection, num_inj)
#   update_trial_increment_num_inj(db_connection)
#   update_trial_crashed(db_connection, is_crashed)
#   update_trial_detected(db_connection, is_detected)
#   update_trial_signal(db_connection, is_signal)
#   update_trial_custom_field(db_connection, field_name, value)
#
# Finish inserting injection campaign information
#   end_trial(db_connection)
#
#
#


# Set up database



def connect_to_existing(database_directory):
    """Connects to a database that already exists and returns a db_connection object
    dictionary (required for operations on the database)

    Args:
        database_directory (string): The string used by sqlalchemy to connect to the database.

        String of the form: 'sqlite://<nohostname>/<path>'

        If the database path is relative:
            e.g. 'sqlite:///foo.db' (database located at ./foo.db)

        If the path is absolute:
            Unix/Mac - 4 initial slashes in total
            'sqlite:////absolute/path/to/foo.db'

            Windows
            'sqlite:///C:\\path\\to\\foo.db'

            Windows alternative using raw string
            r'sqlite:///C:\path\to\foo.db'

    Returns:
        db_connection (dictionary): Custom dictionary containing database connection information
        used in later stages for interacting with the database

        Of the form:
        db_connection =
        {
          'engine': -,
          'metadata': -,
          'Base': -,
          'trial_number': -,
        }

    """
    from sqlalchemy import create_engine
    engine = create_engine(database_directory)

    from sqlalchemy.ext.declarative import declarative_base
    Base = declarative_base()

    from sqlalchemy import MetaData
    metadata = MetaData()
    metadata.create_all(engine)

    db_connection = generate_db_connection(engine = engine, metadata = metadata, Base = Base)
    return db_connection

def create_and_connect_database(database_directory):
    """Creates and connects to a new database file and returns a db_connection object
    dictionary (required for operations on the database)

    Args:
        database_directory (string): The string used by sqlalchemy to connect to the
        database. This will be where the database should be created.

        String of the form: 'sqlite://<nohostname>/<path>'

        If the database path is relative:
            e.g. 'sqlite:///foo.db' (database located at ./foo.db)

        If the path is absolute:
            Unix/Mac - 4 initial slashes in total
            'sqlite:////absolute/path/to/foo.db'

            Windows
            'sqlite:///C:\\path\\to\\foo.db'

            Windows alternative using raw string
            r'sqlite:///C:\path\to\foo.db'

    Returns:
        db_connection (dictionary): Custom dictionary containing database connection information
        used in later stages for interacting with the database

        Of the form:
        db_connection =
        {
          'engine': -,
          'metadata': -,
          'Base': -,
          'trial_number': -,
        }

    """

    from sqlalchemy import create_engine
    from sqlalchemy.ext.declarative import declarative_base

    engine = create_engine(database_directory)

    Base = declarative_base()

    from sqlalchemy import Table, Column, Integer, String, Float, MetaData
    from sqlalchemy.sql import text

    metadata = MetaData()

    # Schema for the database we will create
    sites = Table('sites', metadata,
        Column('siteId', Integer, primary_key=True,autoincrement=True),
        Column('site', Integer, nullable=True),
        Column('type', String, nullable=True),
        Column('comment', String, nullable=True),
        Column('file', String, nullable=True),
        Column('func', String, nullable=True),
        Column('line', Integer, nullable=True),
        Column('opcode', Integer, nullable=True),
    )

    trials = Table('trials', metadata,
        Column('trial', Integer, primary_key=True,autoincrement=True),
        Column('numInj', Integer, nullable=False, server_default=text('0')),
        Column('crashed', Integer, nullable=False, server_default=text('0')), # Boolean
        Column('detected', Integer, nullable=False, server_default=text('0')), # Boolean
        Column('path', String, nullable=True),
        Column('signal', Integer, nullable=False, server_default=text('0')), # Boolean
    )

    injections = Table('injections', metadata,
        Column('injectionId',Integer, primary_key=True,autoincrement=True),
        Column('trial', Integer, nullable=False),
        Column('siteId', Integer, nullable=False),
        Column('rank', Integer, nullable=True),
        Column('threadId', Integer, nullable=True),
        Column('prob', Float, nullable=True),
        Column('bit', Integer, nullable=True),
        Column('cycle', Integer, nullable=True),
        Column('notes', String, nullable=True),
    )

    signals = Table('signals', metadata,
        Column('signalId', Integer, primary_key=True,autoincrement=True),
        Column('trial', Integer, nullable=False),
        Column('signal', Integer, nullable=False),
        Column('rank', Integer, nullable=True),
        Column('threadId', Integer, nullable=True),
    )

    detections = Table('detections', metadata,
        Column('detectionId', Integer, primary_key=True,autoincrement=True),
        Column('trial', Integer, nullable=False),
        Column('latency', Integer, nullable=True),
        Column('detector', String, nullable=False),
        Column('rank', Integer, nullable=True),
        Column('threadId', Integer, nullable=True),
    )

    metadata.create_all(engine)



    db_connection = generate_db_connection(engine = engine, metadata = metadata, Base = Base)

    # Update database reflection
    reflect_database(db_connection)

    return db_connection



# Extend existing tables

def extend_sites_table(db_connection, column_name, column_type, default_value = None):
    """Allows the user to customize the sites table by inserting a new column and
    updates the schema stored in the db_connection file accordingly.

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        column_name (string): name of column to insert
        column_type (string): datatype of column to insert
            Available types:
                'INTEGER',
                'TEXT',
                'REAL',
                'NUMERIC'
            Please refer to this: http://sqlite.org/datatype3.html

        default_value (optional) (string/integer): default value to insert - will be set to null if parameter not passed

    """

    from sqlalchemy.sql import text


    t = ""
    if default_value == None:
        t = text("ALTER TABLE sites ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE sites ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    db_connection['engine'].execute(t)

    # Update the stored database schema - This updates the db_connection dict
    reflect_database(db_connection)



def extend_trial_table(db_connection, column_name, column_type, default_value = None):
    """Allows the user to customize the trial table by inserting a new column and
    updates the schema stored in the db_connection file accordingly.

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        column_name (string): name of column to insert
        column_type (string): datatype of column to insert
            Available types:
                'INTEGER',
                'TEXT',
                'REAL',
                'NUMERIC'
            Please refer to this: http://sqlite.org/datatype3.html

        default_value (optional) (string/integer): default value to insert - will be set to null if parameter not passed

    """

    from sqlalchemy.sql import text


    t = ""
    if default_value == None:
        t = text("ALTER TABLE trials ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE trials ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    db_connection['engine'].execute(t)

    # Update the stored database schema - This updates the db_connection dict
    reflect_database(db_connection)




def extend_injections_table(db_connection, column_name, column_type, default_value = None):
    """Allows the user to customize the injections table by inserting a new column and
    updates the schema stored in the db_connection file accordingly.

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        column_name (string): name of column to insert
        column_type (string): datatype of column to insert
            Available types:
                'INTEGER',
                'TEXT',
                'REAL',
                'NUMERIC'
            Please refer to this: http://sqlite.org/datatype3.html

        default_value (optional) (string/integer): default value to insert - will be set to null if parameter not passed

    """

    from sqlalchemy.sql import text

    t = ""
    if default_value == None:
        t = text("ALTER TABLE injections ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE injections ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    db_connection['engine'].execute(t)

    # Update the stored database schema - This updates the db_connection dict
    reflect_database(db_connection)



def extend_signals_table(db_connection, column_name, column_type, default_value = None):
    """Allows the user to customize the signals table by inserting a new column and
    updates the schema stored in the db_connection file accordingly.

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        column_name (string): name of column to insert
        column_type (string): datatype of column to insert
            Available types:
                'INTEGER',
                'TEXT',
                'REAL',
                'NUMERIC'
            Please refer to this: http://sqlite.org/datatype3.html

        default_value (optional) (string/integer): default value to insert - will be set to null if parameter not passed

    """

    from sqlalchemy.sql import text


    t = ""
    if default_value == None:
        t = text("ALTER TABLE signals ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE signals ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    db_connection['engine'].execute(t)

    # Update the stored database schema - This updates the db_connection dict
    reflect_database(db_connection)


def extend_detections_table(db_connection, column_name, column_type, default_value = None):
    """Allows the user to customize the detections table by inserting a new column and
    updates the schema stored in the db_connection file accordingly.

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        column_name (string): name of column to insert
        column_type (string): datatype of column to insert
            Available types:
                'INTEGER',
                'TEXT',
                'REAL',
                'NUMERIC'
            Please refer to this: http://sqlite.org/datatype3.html

        default_value (optional) (string/integer): default value to insert - will be set to null if parameter not passed

    """

    from sqlalchemy.sql import text

    t = ""
    if default_value == None:
        t = text("ALTER TABLE detections ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE detections ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    db_connection['engine'].execute(t)

    # Update the stored database schema - This updates the db_connection dict
    reflect_database(db_connection)




def insert_site(db_connection, row_arguments):
    """Insert a row into the sites table, if site information is known by user

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        row_arguments (dictionary): dictionary containing the row to insert.

            row_arguments = {
                'site': Integer (Optional),
                'type': String (Optional),
                'comment': String (Optional),
                'file': String (Optional),
                'func': String (Optional),
                'line': Integer (Optional),
                'opcode': Integer (Optional),
                'numExecutions': Integer (Optional)
            }

            Site: If you have a customized identifier for your site. E.g. memory address. Please ensure that this identifier is unique! If this is a
                duplicate site identifier, this will be interpreted as meaning that the same site has been executed again, and therefore only the
                numExecutions field will be incremented.

            Type: Please use the following:
                "Arith-FP",
                "Pointer",
                "Arith-Fix",
                "Ctrl-Loop",
                "Ctrl-Branch",
                "Unknown"

            File: Please use absolute paths

            Opcode: Please use the opcodes for your architecture.
                /*You can then set the architecture in a configuration file within FaultSight (./config/config.py)*/
                At the moment, please edit the `opcode2Str` function in the `utils.py` file.

            NumExecutions: The number of times this site has been executed (e.g., within a for/while loop). This allows us to use dynamic instructions in
                statistical calculations. If this value is not provided, statistical calulations will use static instructions instead.



            For optional attributes, please exclude that key from the dictionary if not used.
            Therefore if none of the attributes will be set, please pass an empty dictionary ({})
    """


    table = get_reflected_table(db_connection, 'sites')

    # Query the table to see if a site with this identifier already exists
    if 'site' in row_arguments:
        site_entry = check_site_exists(db_connection, row_arguments['site'])
        if site_entry != False:
            update_site_num_executions(db_connection, row_arguments['site'], site_entry.numExecutions + 1)
            return

    insert = table(**row_arguments)

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.add(insert)
    session.commit()

def check_site_exists(db_connection, site):
    """Checks if the site exists and return site dictionary if it exists. Returns false otherwise

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        site: (integer) site identifier -  the identifier used when calling insert_site() with 'site' key included in row_arguments


    Returns:
        site table entry: (dictionary) or None if entry does not exist
            site_entry = {
                'id': Integer
                'site': Integer
                'type': Integer
                'comment': String
                'file': String
                'func': String
                'line': Integer
                'opcode': Integer,
                'numExecutions': Integer,
            }

    """

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()

    table = get_reflected_table(db_connection, 'sites')

    curr_site = session.query(table).filter(table.site == site)

    if curr_site.count() != 0:
        return curr_site.first()
    return False


def check_detection_exists(db_connection, trial):
    """Checks if a detection exists for the current trial and return detection dictionary if it exists

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information


    Returns:
        site table entry: (dictionary) or None if entry does not exist
            site_entry = {
                'detectionId': Integer
                'trial': Integer
                'latency': Integer
                'detector': String
                'rank': Integer
                'threadId': Integer
            }


    """

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()

    table = get_reflected_table(db_connection, 'detections')

    curr_site = session.query(table).filter(table.trial == trial)

    if curr_site.count() == 1:
        return curr_site.one()
    return False


# Start/End trial



def start_trial(db_connection, row_arguments):
    """Insert a row into the trials table, and returns the trialID

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        row_arguments (dictionary): dictionary containing the information to insert.

            row_arguments = {
                'path': String (Optional),
            }


            For optional attributes, please exclude that key from the dictionary if not used.
            Therefore if none of the attributes will be set, please pass an empty dictionary ({})

    """

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()

    table = get_reflected_table(db_connection, 'trials')

    insert = table(**row_arguments)

    session.add(insert)
    session.commit()

    db_connection['trial_number'] = insert.trial


def end_trial(db_connection):
    """End a trial

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
    """

    db_connection['trial_number'] = None

# Update site entries - for pre-inserted sites
def update_site_type(db_connection, site, type):
    table = get_reflected_table(db_connection, 'sites')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.site == site)\
        .update({"type": type})
    session.commit()

def update_site_comment(db_connection, site, comment):
    table = get_reflected_table(db_connection, 'sites')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.site == site)\
        .update({"comment": comment})
    session.commit()

def update_site_location(db_connection, site, file = "", func = "", line = ""):
    table = get_reflected_table(db_connection, 'sites')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.site == site)\
        .update({"file": file, "func": func, "line": line})
    session.commit()

def update_site_opcode(db_connection, site, opcode):
    table = get_reflected_table(db_connection, 'sites')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.site == site)\
        .update({"opcode": opcode})
    session.commit()

def update_site_num_executions(db_connection, site, num_executions):
    table = get_reflected_table(db_connection, 'sites')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.site == site)\
        .update({"numExecutions": num_executions})
    session.commit()


def update_site_custom_field(db_connection, site, field, value):
    table = get_reflected_table(db_connection, 'sites')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.site == site)\
        .update({field: value})
    session.commit()

# Update current trial entries

def update_trial_num_inj(db_connection, num_inj):
    """Update the number of injections for the current trial

    Requires start_trial(db_connection, row_arguments) to have been called first

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        num_inj (integer): the number of injections for the current trial
    """

    if (db_connection['trial_number'] == None):
        print('Trial has not been started')
        sys.exit(0)

    table = get_reflected_table(db_connection, 'trials')
    #query = table.update().\
    #    where(table.trial == db_connection['trial_number']).\
    #    values(numInj=num_inj)
    #
    #conn = db_connection['engine'].connect()
    #conn.execute(query)

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.trial == db_connection['trial_number'])\
        .update({"numInj": num_inj})

    session.commit()

def update_trial_increment_num_inj(db_connection):
    """Increment the number of injections for the current trial by one

    Requires start_trial(db_connection, row_arguments) to have been called first

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
    """

    if (db_connection['trial_number'] == None):
        print('Trial has not been started')
        sys.exit(0)

    table = get_reflected_table(db_connection, 'trials')

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()

    current_trial = session.query(table)\
                            .filter(table.trial == db_connection['trial_number'])\
                            .first()
    if not current_trial:
        print('No existing trial found')
        sys.exit(0)

    session.query(table)\
        .filter(table.trial == db_connection['trial_number'])\
        .update({"numInj": current_trial.numInj + 1})

    session.commit()

    #query = table.update().\
    #    where(table.trial == db_connection['trial_number']).\
    #    values(numInj=current_trial.numInj + 1)
    #
    #conn = db_connection['engine'].connect()
    #conn.execute(query)

def update_trial_crashed(db_connection, is_crashed):
    """Update whether the current trial has crashed

    Requires start_trial(db_connection, row_arguments) to have been called first

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        is_crashed (boolean): whether the current trial has crashed
    """

    if (db_connection['trial_number'] == None):
        print('Trial has not been started')
        sys.exit(0)

    is_crashed = int(is_crashed == True)

    table = get_reflected_table(db_connection, 'trials')

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.trial == db_connection['trial_number'])\
        .update({"crashed": is_crashed})
    session.commit()

    #query = table.update().\
    #    where(table.trial == db_connection['trial_number']).\
    #    values(crashed=is_crashed)
    #
    #conn = db_connection['engine'].connect()
    #conn.execute(query)

def update_trial_detected(db_connection, is_detected):
    """Update whether silent data corruption has been detected for the current trial

    Requires start_trial(db_connection, row_arguments) to have been called first

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        is_detected (boolean): whether silent data corruption has been detected for the current trial
    """

    if (db_connection['trial_number'] == None):
        print('Trial has not been started')
        sys.exit(0)

    is_detected = int(is_detected == True)


    table = get_reflected_table(db_connection, 'trials')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.trial == db_connection['trial_number'])\
        .update({"detected": is_detected})
    session.commit()

    #query = table.update().\
    #    where(table.trial == db_connection['trial_number']).\
    #    values(detected=is_detected)
    #
    #conn = db_connection['engine'].connect()
    #conn.execute(query)

def update_trial_signal(db_connection, is_signal):
    """Update whether a signal has been detected for the current trial

    Requires start_trial(db_connection, row_arguments) to have been called first

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        is_signal (boolean): whether a signal has been detected for the current trial
    """

    if (db_connection['trial_number'] == None):
        print('Trial has not been started')
        sys.exit(0)


    is_signal = int(is_signal == True)

    table = get_reflected_table(db_connection, 'trials')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.trial == db_connection['trial_number'])\
        .update({"signal": is_signal})
    session.commit()

def update_trial_custom_field(db_connection, field_name, value):
    """
    Update a custom field for the current trial

    Requires start_trial(db_connection, row_arguments) to have been called first

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information
        field_name (string): field name to update
        value (int / string / bool): field value
    """

    if (db_connection['trial_number'] == None):
        print('Trial has not been started')
        sys.exit(0)

    table = get_reflected_table(db_connection, 'trials')
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()
    session.query(table)\
        .filter(table.trial == db_connection['trial_number'])\
        .update({field_name: value})
    session.commit()

# Insert rows into database
def insert_injection(db_connection, row_arguments, site_arguments = {}):
    """Insert a row into the injections table. If the site of the injection
    has not been created by the user in the preprocessing stage, it will be created here. Automatically
    adjusts the entry in the trial table corresponding to the current trial. Increments the trial's injection count by one.

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information

        row_arguments (dictionary): dictionary containing the row to insert.

            row_arguments = {
                'site': Integer (Optional),
                'rank': Integer (Optional),
                'threadId': Integer (Optional),
                'prob': Float (Optional),
                'bit': Integer (Optional),
                'cycle': Integer (Optional),
                'notes': String (Optional)
            }


            Site: Please include this if you generated sites in the preprocessing step via insert_site(db_connection, row_arguments). If the 'site' key is not included,
            this function will also generate an entry in the sites table, linking this injection to the newly created site. This new site can be
            customized via the optional site_arguments parameter


            Bit: In case of multiple injections in the same word, please use a python list of bit locations. This will be automatically converted to a bit mask
                 In case of a single injection, please provide a scalar bit-location
                 Please ensure bit values are 0-indexed, and each in the range [0,63]

            For optional attributes, please exclude that key from the dictionary if not used.
            Therefore if none of the attributes will be set, please pass an empty dictionary ({})

        site_arguments (dictionary): dictionary containing the row to insert into the sites table

            site_arguments = {
                'site': Integer (Optional),
                'type': Integer (Optional),
                'comment': String (Optional),
                'file': String (Optional),
                'func': String (Optional),
                'line': String (Optional),
                'opcode': Integer (Optional),
                'numExecutions': Integer (Optional)
            }

            Site: If you have a customized identifier for your site. E.g. memory address

            Type: Please use the following:
                0: "Arith-FP",
                1: "Pointer",
                2: "Arith-Fix",
                3: "Ctrl-Loop",
                4: "Ctrl-Branch",
                5: "Unknown"

            File: Please use absolute paths

            Opcode: Please use the opcodes for your architecture. You can then set the architecture in a configuration file within FaultSight (./config/config.py)

            NumExecutions: The number of times this site has been executed (e.g., within a for/while loop). This allows us to use dynamic instructions in
                statistical calculations. If this value is not provided, statistical calulations will use static instructions instead.

            For optional attributes, please exclude that key from the dictionary if not used.
            Therefore if none of the attributes will be set, please pass an empty dictionary ({})
    """

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()

    sites = get_reflected_table(db_connection, 'sites')

    # Change the user-included site, to the actual site id in the sites table
    if 'site' in row_arguments:
        current_site = session.query(sites)\
                              .filter(sites.site == row_arguments['site'])\
                              .first()
        if not current_site:
            print('Included site does not exist in database. Have you inserted the site via insert_site(db_connection, row_arguments)?')
            sys.exit(0)

        row_arguments['site'] = current_site.siteId


    # Insert a new site into the sites table, if no site was provided by the user
    if 'site' not in row_arguments:
        sites = get_reflected_table(db_connection, 'sites')
        insert = sites(**site_arguments)
        session.add(insert)
        row_arguments['site'] = insert.siteId

    table = get_reflected_table(db_connection, 'injections')

    # Generate a bit mask if necessary
    if 'bit' in row_arguments and isinstance(row_arguments['bit'], list):
        row_arguments['bit'] = int_list_to_mask[row_arguments['bit']]

    # Set the trial number
    row_arguments['trial'] = db_connection['trial_number']

    row_arguments['siteId'] = row_arguments['site']
    row_arguments.pop('site', None)


    insert = table(**row_arguments)

    session.add(insert)
    session.commit()

    update_trial_increment_num_inj(db_connection)



def insert_signal(db_connection, row_arguments):
    """Insert a row into the signals table. If the site of the injection
    has not been created by the user in the preprocessing stage, it will be created here. Automatically adjusts
    the entry in the trial table corresponding to the current trial, setting the trial's signal/crashed attribute to true.

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information

        row_arguments (dictionary): dictionary containing the row to insert.

            row_arguments = {
                'signal': Integer,
                'crashed': Boolean,
                'rank': Integer (Optional),
                'threadId': Integer (Optional),
            }

            Signal: The unix signal number that occured

            crashed: Whether the trial crashed because of this signal - Will simply set the crashed entry in the trial table to true

            For optional attributes, please exclude that key from the dictionary if not used.
    """

    has_crashed = row_arguments['crashed']
    # Remove crashed from dict, as this is not a column in the signals table
    row_arguments.pop('crashed', None)

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()

    table = get_reflected_table(db_connection, 'signals')

    # Set the trial number
    row_arguments['trial'] = db_connection['trial_number']


    insert = table(**row_arguments)

    session.add(insert)
    session.commit()

    update_trial_signal(db_connection, True)
    if has_crashed:
        update_trial_crashed(db_connection, True)


def insert_detection(db_connection, row_arguments):
    """Insert a row into the signals table. If the site of the injection
    has not been created by the user in the preprocessing stage, it will be created here. Automatically adjusts
    the entry in the trial table corresponding to the current trial. Sets the trial's detected attribute to true.

    Args:
        db_connection (dictionary): Custom dictionary containing database connection information

        row_arguments (dictionary): dictionary containing the row to insert.

            row_arguments = {
                'detector': String,
                'latency': Integer (Optional),
                'rank': Integer (Optional),
                'threadId': Integer (Optional),
            }


            Detector: The name of the detector triggered

            For optional attributes, please exclude that key from the dictionary if not used.
    """

    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=db_connection['engine'])()

    table = get_reflected_table(db_connection, 'detections')

    # Set the trial number
    row_arguments['trial'] = db_connection['trial_number']

    insert = table(**row_arguments)

    session.add(insert)
    session.commit()

    update_trial_detected(db_connection, True)


# Utils

def generate_db_connection(engine = None, metadata = None, Base = None, trial_number = None):
    """Generate a db_connection dictionary with the provided input parameters, setting the rest as type None"""
    return {
        'engine': engine,
        'metadata': metadata,
        'Base': Base,
        'trial_number': trial_number
    }


def reflect_database(db_connection):
    """Automatically update the database schema stored in db_connection"""
    from sqlalchemy.ext.automap import automap_base

    relevant_tables = ['sites',
                   'injections',
                   'trials',
                   'detections',
                   'signals']

    from sqlalchemy import MetaData

    metadata = MetaData()
    metadata.create_all(db_connection['engine'])
    db_connection['metadata'] = metadata
    db_connection['metadata'].reflect(db_connection['engine'], only=relevant_tables)
    db_connection['Base'] = automap_base(metadata=db_connection['metadata'])
    db_connection['Base'].prepare()

def get_reflected_table(db_connection, table_name):
    """Gets the requested table class"""
    Base = db_connection['Base']
    table_dict = {
        'sites': Base.classes.sites,
        'injections': Base.classes.injections,
        'trials': Base.classes.trials,
        'detections': Base.classes.detections,
        'signals': Base.classes.signals,
    }
    return table_dict[table_name]

def int_list_to_mask(bit_list):
    """Convert a list of unique integers to a bit mask"""
    return_val = 0;
    for bit_idx in bit_list:
        if bit_idx >= 64:
            print('bit_idx is larger than 64. Currently only supporting injections in up to 64 bit values.')
            sys.exit(0)
        return_val = set_bit(return_val, bit_idx)
    return return_val

def set_bit(value, bit):
    """Flip the 'bit'-th bit in value"""
    return value | (1<<bit)
