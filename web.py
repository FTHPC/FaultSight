import ConfigParser
import os, sys
import src.faultsight as web

CONFIG_FILE_NAME = "analysis_config.ini"

"""Check if config file at path exists and create config if necessary"""
def checkConfig(path):
    if not os.path.exists(path):
        createConfig(path)

"""Create the default config file at path"""
def createConfig(path):
    config = ConfigParser.ConfigParser()
    config.add_section("FaultSight")
    config.set("FaultSight", "myGraphList", [0,1,2,6])
    config.set("FaultSight", "highlightValue", 10)
    config.add_section("CustomConstraint")
    config.set("CustomConstraint","trials",'["crashed","detection"]')
    config.set("CustomConstraint","sites",'["type"]')
    config.set("CustomConstraint","injections",'["bit","rank"]')
    config.set("CustomConstraint","detections",'["detector","latency"]') 
    with open(path, "wb") as config_file:
        config.write(config_file)

"""Set up databse, config file, etc.. then launch the application"""
if __name__ == "__main__":
    import logging
    logging.basicConfig(filename='faultsight.log',level=logging.DEBUG)
    checkConfig(CONFIG_FILE_NAME)
    web.initFlaskApplication(CONFIG_FILE_NAME)  
