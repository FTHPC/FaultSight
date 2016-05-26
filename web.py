from database import init, finalize
from custom import customInit, customParser
from analysis_config import *
import ConfigParser
import os
import src.faultsight as web


CONFIG_FILE_NAME = "analysis_config.ini"


"""Check if config file at path exists and return true if rebuild is necessary"""
def checkConfig(path):
    if not os.path.exists(path):
        createConfig(path)
        return True
    else:
        return checkIfRebuildNecessary(path)

"""Check config file if we want to rebuild database"""
def checkIfRebuildNecessary(path):
    config = ConfigParser.ConfigParser()
    config.read(path)
    return config.get("FlipIt", "rebuild_database")

"""Create the default config file at path. Rebuild database on by default"""
def createConfig(path):
    config = ConfigParser.ConfigParser()
    config.add_section("FlipIt")
    config.set("FlipIt", "rebuild_database", True)
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

"""Query databse for a list of functions that have been injected into"""
"""Returns a list of the form: ['functionA', 'functionB',...]"""

def getFunctionLists(c):
    allFunctionList = getFunctionListAll(c)
    injectedFunctionList = getFunctionListInjected(c)
    notInjectedFunctionList = getFunctionListNotInjected(allFunctionList,injectedFunctionList)
    return allFunctionList, injectedFunctionList, notInjectedFunctionList

"""List of all functions in database"""
def getFunctionListAll(c):
    c.execute("SELECT DISTINCT function FROM sites")
    functionList = [x[0].encode('UTF8') for x in c.fetchall()]
    return functionList

"""List of function that have been injected into"""
def getFunctionListInjected(c):
    c.execute("SELECT DISTINCT function FROM sites INNER JOIN injections ON sites.site = injections.site")
    functionList = [x[0].encode('UTF8') for x in c.fetchall()]
    return functionList

"""List of functions that have not been injected into"""
def getFunctionListNotInjected(allFunctionList, injectedFunctionList):
    return [x for x in allFunctionList if x not in injectedFunctionList]

"""Get total number of injections"""
def getNumTrialsInj(c):
    cur = c.execute("SELECT * FROM trials WHERE trials.numInj > 0")
    numTrialsInj = 1. * len(cur.fetchall())
    if numTrialsInj == 0:
        print "No injections found to visualize..."
        sys.exit(1)
    return numTrialsInj

"""Get total number of trials"""
def getNumTrials(c):
    cur = c.execute("SELECT * FROM trials")
    numTrials = 1. * len(cur.fetchall())
    return numTrials

"""Set up databse, config file, etc.. then launch the application"""
if __name__ == "__main__":
    rebuild_database = checkConfig(CONFIG_FILE_NAME)
    c = init(database, LLVM_log_path, trial_path +"/"+ trial_prefix,\
        customFuncs=(customInit, customParser))
    allFunctionList, injectedFunctionList, notInjectedFunctionList = getFunctionLists(c)
    web.initFlaskApplication(injectedFunctionList, notInjectedFunctionList, allFunctionList, getNumTrialsInj(c), getNumTrials(c), CONFIG_FILE_NAME)  
