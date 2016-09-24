import ConfigParser
import os, sys
from faultSight import app


# User adjustable constants


# Link to original program source. This is useful when your database was created
# on another machine. Your database would contain the absolute path of each
# file. If the actual source code is available on this machine, we can try to
# search for each file at SRC_PATH.

# We are currently searching for files in the following order:
# 1.) DATABASE_FILENAME
# 2.) SRC_PATH/DATABASE_FILENAME_TRUNCATED
# TODO:
# OR we can switch to using relative paths in our databse, and always refer to
# it using SRC_PATH?
SRC_PATH = "../SRC-GOES-HERE" 

RECREATE_CONFIG_FILE = False


CONFIG_FILE_NAME = "faultSight/analysis_config.ini"



"""Check if config file at path exists and create config if necessary"""
def checkConfig():
    if RECREATE_CONFIG_FILE or not os.path.exists(CONFIG_FILE_NAME):
        createConfig(CONFIG_FILE_NAME)

"""Create the default config file at path"""
def createConfig(path):
    config = ConfigParser.ConfigParser()
    config.add_section("FaultSight")
    config.set("FaultSight", "myGraphList", [0,1,2,6])
    config.set("FaultSight", "highlightValue", '10')
    config.set("FaultSight", "srcPath", SRC_PATH)
    config.add_section("CustomConstraint")
    config.set("CustomConstraint","trials",'["crashed","detection"]')
    config.set("CustomConstraint","sites",'["type"]')
    config.set("CustomConstraint","injections",'["bit","rank"]')
    config.set("CustomConstraint","detections",'["detector","latency"]') 
    with open(path, "wb") as config_file:
        config.write(config_file)



def checkDatabase():
    if not os.path.exists("faultSight/database/campaign.db"):
        sys.exit()






# Enable logging for various errors
import logging
logging.basicConfig(filename='faultSight.log',level=logging.DEBUG)

# Check configuration file is in place.
checkConfig()

# Check database file is in place
checkDatabase()

# Start main application
app.run(debug=True)
