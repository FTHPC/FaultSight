from flask import Flask
import logging
import os, sys

app = Flask(__name__)
app.config.from_object('config.default')

from faultSight.database import db, relevant_tables, sites, trials, injections

# Read basic information from database that will be stored in config
# We want to run this section before starting the main web app


# Get list of functions - injected and not injected

# List of all functions found in database
distinct_functions = []
for site in db.session.query(sites).distinct(sites.func).group_by(sites.func):
    distinct_functions.append(site.func)
app.config['FUNCTIONS'] = distinct_functions


# List of functions injected into
injected_functions = []
for site in db.session.query(sites)\
							  .join(injections, sites.siteId==injections.siteId)\
							  .distinct(sites.func)\
                              .group_by(sites.func):
	injected_functions.append(site.func)
app.config['INJECTED_FUNCTIONS'] = injected_functions


# List of functions not injected into
not_injected_functions = list(set(distinct_functions) - set(injected_functions))
app.config['NOT_INJECTED_FUNCTIONS'] = not_injected_functions


# Get total number of injections
num_injections = db.session.query(trials).filter(trials.numInj > 0).count()
if num_injections == 0:
    logging.error("No injections found to visualize...")
    sys.exit(1)
app.config['NUM_INJECTIONS'] = num_injections


# Get total number of trials
num_trials = db.session.query(trials).count()
app.config['NUM_TRIALS'] = num_trials


import faultSight.views
