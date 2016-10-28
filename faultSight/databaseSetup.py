import sqlite3, os, sys



# API Calls - Wrappers to SQL queries

# database_directory should be of form: 'sqlite:///database/campaign.db'
def create_database(database_directory):
    print('called')
    from sqlalchemy import create_engine
    from sqlalchemy.ext.declarative import declarative_base

    global engine
    engine = create_engine(database_directory)
    
    Base = declarative_base()

    from sqlalchemy import Table, Column, Integer, String, Float, MetaData

    global metadata
    metadata = MetaData()

    sites = Table('sites', metadata,
        Column('id', Integer, primary_key=True,autoincrement=True),
        Column('site', Integer, nullable=True),
        Column('type', Integer, nullable=True),
        Column('comment', String, nullable=True),
        Column('file', String, nullable=True),
        Column('func', String, nullable=True),
        Column('line', Integer, nullable=True),
        Column('opcode', Integer, nullable=True),
    )

    trials = Table('trials', metadata,
        Column('trial', Integer, primary_key=True,autoincrement=True),
        Column('numInj', Integer, nullable=False),
        Column('crashed', Integer, nullable=False),
        Column('detected', Integer, nullable=False),
        Column('path', String, nullable=True),
        Column('signal', Integer, nullable=False),
    )

    injections = Table('injections', metadata,
        Column('injectionId',Integer, primary_key=True,autoincrement=True),
        Column('trial', Integer, nullable=False),
        Column('site', Integer, nullable=False),
        Column('rank', Integer, nullable=True),
        Column('threadId', Integer, nullable=True),
        Column('prob', Float, nullable=True),   # <-- Nullable?
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

    # Update database reflection
    reflect_database()



# Extend existing tables

def extend_trial_table(column_name, column_type, default_value = None):
    from sqlalchemy.sql import text

    global engine;

    t = ""
    if default_value == None:
        t = text("ALTER TABLE trials ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE trials ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    engine.execute(t)

    # Update database reflection
    reflect_database()



def extend_injections_table(column_name, column_type, default_value = None):
    from sqlalchemy.sql import text

    global engine;
    
    t = ""
    if default_value == None:
        t = text("ALTER TABLE injections ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE injections ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    engine.execute(t)

    # Update database reflection
    reflect_database()


def extend_signals_table(column_name, column_type, default_value = None):
    from sqlalchemy.sql import text

    global engine;
    
    t = ""
    if default_value == None:
        t = text("ALTER TABLE signals ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE signals ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    engine.execute(t)

    # Update database reflection
    reflect_database()



def extend_detections_table(column_name, column_type, default_value = None):
    from sqlalchemy.sql import text

    global engine
    
    t = ""
    if default_value == None:
        t = text("ALTER TABLE detections ADD COLUMN {0} {1} NULL;".format(column_name, column_type))
    else:
        t = text("ALTER TABLE detections ADD {0} {1} NOT NULL DEFAULT {2}".format(column_name, column_type, default_value))

    engine.execute(t)

    # Update database reflection
    reflect_database()



# 1.) Preprocessing - Site information (Optional)
# If user has previous knowledge regarding sites

# Insert site
# Parameters:
# Site number: Optional (Increment if none)
# Location, etc..

def reflect_database():
    from sqlalchemy.ext.automap import automap_base

    global engine
    global metadata
    global Base
    relevant_tables = ['sites', 
                   'injections', 
                   'trials', 
                   'detections',
                   'signals']

    metadata.reflect(engine, only=relevant_tables)
    Base = automap_base(metadata=metadata)
    Base.prepare()

def get_reflected_table(table_name):
    global Base

    table_dict = {
        'sites': Base.classes.sites,
        'injections': Base.classes.injections,
        'trials': Base.classes.trials,
        'detections': Base.classes.detections,
        'signals': Base.classes.signals,
    }
    return table_dict[table_name]


def insert_site(row_arguments):
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=engine)()

    table = get_reflected_table('sites')

    # row_arguents is a dict {"colname1":value, "colname2":value}
    insert = table(**row_arguments)

    session.add(insert)
    session.commit()


def start_trial(row_arguments):
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=engine)()

    table = get_reflected_table('trials')

    # row_arguents is a dict {"colname1":value, "colname2":value}
    insert = trials(**row_arguments)

    session.add(insert)
    session.commit()

    global trial_number
    trial_number = insert.trial

    return trial_number


def update_trial_num_inj(trial_number, num_inj):
    global engine

    table = get_reflected_table('trials')
    query = users.update().\
        where(table.trial == trial_number).\
        values(numInj=num_inj)

    conn = engine.connect()
    conn.execute(query)

def update_trial_crashed(trial_number, is_crashed):
    global engine
    
    table = get_reflected_table('trials')
    query = users.update().\
        where(table.trial == trial_number).\
        values(isCrashed=is_crashed)

    conn = engine.connect()
    conn.execute(query)

def update_trial_detected(trial_number, is_detected):
    global engine
    
    table = get_reflected_table('trials')
    query = users.update().\
        where(table.trial == trial_number).\
        values(isDetected=is_detected)

    conn = engine.connect()
    conn.execute(query)

def update_trial_signal(trial_number, is_signal):
    global engine
    
    table = get_reflected_table('trials')
    query = users.update().\
        where(table.trial == trial_number).\
        values(isSignal=is_signal)

    conn = engine.connect()
    conn.execute(query)


def end_trial(trial_number = None):
    global trial_number
    trial_number = None


def insert_injection(row_arguments, auto_update_trial):
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=engine)()

    table = get_reflected_table('injections')

    # row_arguents is a dict {"colname1":value, "colname2":value}
    insert = table(**row_arguments)

    session.add(insert)
    session.commit()

def insert_signal(row_arguments, auto_update_trial):
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=engine)()

    table = get_reflected_table('signals')

    # row_arguents is a dict {"colname1":value, "colname2":value}
    insert = table(**row_arguments)

    session.add(insert)
    session.commit()

def insert_detection(row_arguments, auto_update_trial):
    from sqlalchemy.orm import sessionmaker
    session = sessionmaker(bind=engine)()

    table = get_reflected_table('detections')

    # row_arguents is a dict {"colname1":value, "colname2":value}
    insert = table(**row_arguments)

    session.add(insert)
    session.commit()

