from faultSight import app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from sqlalchemy.ext.automap import automap_base


# Please ensure each table has a primary key, otherwise SQLAlchemy will be
# unable to automatically determine the database schema

relevant_tables = ['sites',
				   'injections',
				   'trials',
				   'detections',
				   'signals']

db = SQLAlchemy(app, metadata = MetaData())
db.metadata.reflect(db.engine, only=relevant_tables)
Base = automap_base(metadata=db.metadata)
Base.prepare()


# Variable names should stay constant
sites = Base.classes.sites
injections = Base.classes.injections
trials = Base.classes.trials
detections = Base.classes.detections
signals = Base.classes.signals

table_mapping = {
	'sites': sites,
	'injections': injections,
	'trials': trials,
	'detections': detections,
	'signals': signals
}
