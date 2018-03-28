import ConfigParser
import os, sys
from faultSight import app


# User adjustable constants


# Link to original program source. This is useful when your database was created
# on another machine. Your database would then contain the absolute path of each
# file on the original machine. If the actual source code is also available on this
# machine, FaultSight will try adjusting the file path to find the file on this
# machine. Simply provide the absolute path of the package on this
# machine (in the form "/foo/bar") in SRC_PATH below.

SRC_PATH = "/foo/bar"

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
    config.set("FaultSight", "myGraphList", [1,2,6])
    config.set("FaultSight", "highlightValue", '10')
    config.set("FaultSight", "confidenceValue", '95')
    config.set("FaultSight", "statisticalUseAllTrials", True)
    config.set("FaultSight", "statisticalStartTrial", '0')
    config.set("FaultSight", "statisticalEndTrial", '0')
    config.set("FaultSight", "useDynamic", False)
    config.set("FaultSight", "srcPath", SRC_PATH)
    config.set("FaultSight", "useDeltaFormulaForTost", True)
    config.set("FaultSight", "deltaValueForTost", '0')
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
