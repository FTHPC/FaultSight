import os, sys
import sqlite3
from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash, json, jsonify
import numpy as np
import ConfigParser

from constants import *
import logging

app = Flask(__name__)
app.config.from_object(__name__)

"""Parameters stored in app.config:
INJECTED_FUNCTIONS: List of function that have been injected into
NOT_INJECTED_FUNCTIONS: List of functions that have not been injected into
FUNCTIONS: List of all functions
CONFIG_PATH: Path to configuration file. This is stored in the parent directory (file called analysis_config.ini by default)
DATABASE: Path to database file. This is stored in the parent directory (file called campaign.db by default)
"""

def initFlaskApplication(config_path):
    c = sqlite3.connect(DATABASE).cursor()
    allFunctionList, injectedFunctionList, notInjectedFunctionList = getFunctionLists(c)
    app.debug = DEBUG_STATUS
    app.config['INJECTED_FUNCTIONS'] = injectedFunctionList
    app.config['NOT_INJECTED_FUNCTIONS'] = notInjectedFunctionList
    app.config['FUNCTIONS'] = allFunctionList
    app.config['CONFIG_PATH'] = config_path
    global numTrialsInj
    numTrialsInj = getNumTrialsInj(c)
    global numTrials
    numTrials = getNumTrials(c)
    app.run()

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
        logging.error("No injections found to visualize...")
        sys.exit(1)
    return numTrialsInj

"""Get total number of trials"""
def getNumTrials(c):
    cur = c.execute("SELECT * FROM trials")
    numTrials = 1. * len(cur.fetchall())
    return numTrials


@app.before_request
def before_request():
    g.db = connect_db()

def connect_db():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.text_factory = str
    return conn

@app.teardown_request
def teardown_request(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()


#---Page Requests---#
"""Request for entire Application page"""
@app.route('/')
def index():
    return render_template('main.html', functionList = app.config['FUNCTIONS'], injectedFunctionList = app.config['INJECTED_FUNCTIONS'], notInjectedFunctionList = app.config['NOT_INJECTED_FUNCTIONS'], databaseDetails = getDatabaseTables(),mainGraphList = getMainGraph() )


"""Request for specific function page"""
@app.route('/function/<functionName>')
def showFunction(functionName):
    if not checkIfFunctionExists(functionName):
        return render_template('error.html', functionList = app.config['FUNCTIONS'])
    readFunctionResult = readFunction(functionName)
    myGraphList = getMyGraphs(functionName)
    if len(readFunctionResult) == 1:
        return render_template('emptyFunction.html', functionName=functionName, functionList = app.config['FUNCTIONS'], entireCode = readFunctionResult[0],  databaseDetails=getDatabaseTables(),injectedFunctionList = app.config['INJECTED_FUNCTIONS'], notInjectedFunctionList = app.config['NOT_INJECTED_FUNCTIONS'], myGraphList=json.dumps(myGraphList),myGraphListLength=len(myGraphList))
    elif len(readFunctionResult) == 0:
        # No file found. Perhaps the analysis was run on a different computer?
        return render_template('missingFunction.html', functionName=functionName, functionList = app.config['FUNCTIONS'],  databaseDetails=getDatabaseTables(),injectedFunctionList = app.config['INJECTED_FUNCTIONS'], notInjectedFunctionList = app.config['NOT_INJECTED_FUNCTIONS'], myGraphList=json.dumps(myGraphList),myGraphListLength=len(myGraphList))

    highlightMinimumValue = readIdFromConfig("FaultSight", "highlightValue")

    partialCode = readFunctionResult[0]
    partialCodeValues = readFunctionResult[1]
    partialStartLine = readFunctionResult[2]
    partialHighlightIndexes = readFunctionResult[3]
    entireCode = readFunctionResult[4]
    failedInjectionPercentage = readFunctionResult[5]
    fractionOfApplciation = readFunctionResult[6]
    machineInstructions, numInjectionsInFunction = getMachineInstructionData(functionName,partialHighlightIndexes,partialStartLine)
    
    return render_template('function.html', functionName=functionName, functionList = app.config['FUNCTIONS'], failedInjectionPercentage=failedInjectionPercentage, \
         partialCode=partialCode, partialCodeValues=partialCodeValues[1:], partialHighlightIndexes=partialHighlightIndexes,  machineInstructions=machineInstructions, highlightMinimumValue=highlightMinimumValue, partialStartLine=partialStartLine, entireCode=entireCode, myGraphList=json.dumps(myGraphList), myGraphListLength=len(myGraphList), fractionOfApplciation=fractionOfApplciation,  databaseDetails=getDatabaseTables(),injectedFunctionList = app.config['INJECTED_FUNCTIONS'], notInjectedFunctionList = app.config['NOT_INJECTED_FUNCTIONS'], numInjectionsInFunction=numInjectionsInFunction)

def checkIfFunctionExists(functionName):
    return functionName in app.config['FUNCTIONS']


"""Creates a dict containing tables, columns, and column data types"""
def getDatabaseTables():
    databaseInfo = {}
    currQuery = g.db.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
    result = currQuery.fetchall()
    for idx, tableName in enumerate(result):
        currTableInfo = {}
        currQueryTable = g.db.execute("PRAGMA table_info({})".format(tableName[0]))
        resultTable = currQueryTable.fetchall()
        for column in range(len(resultTable)):
            currTableInfo[resultTable[column][1]] = resultTable[column][2]
        databaseInfo[tableName[0]] = currTableInfo
    return databaseInfo

"""Gets the default graph (Functions injected into) displayed on the home page"""
def getMainGraph():
    # Main Graph is a pie chart of all functions with injections.
    regionData = {'Region':"", 'Start':"",'End':""}
    constraintData = {}
    return [getMyGraph(INJECTED_FUNCTIONS,regionData,constraintData)]


"""Get a list of 'My Graph' graph data (These are specified in config file)"""
def getMyGraphs(functionName):
    myGraphArray = json.loads(readIdFromConfig("FaultSight", "myGraphList"))
    myGraphList = []
    regionData = {'Region':functionName, 'Start':"",'End':""}
    constraintData = {}
    for i in range(len(myGraphArray)):
        myGraphList.append(getMyGraph(myGraphArray[i],regionData,constraintData))
    return myGraphList

"""Gets the specific requested graph"""
def getMyGraph(detail,regionData,constraintData):
    data = []
    dataInfo = []
    if detail == 1:
        data, dataInfo = focusInjections(detail, regionData, constraintData)
    elif detail == 2:
        data, dataInfo = focusInjections(detail, regionData, constraintData)
    elif detail == 3:
        data, dataInfo = focusInjections(detail, regionData, constraintData)
    elif detail == 4:
        data, dataInfo = focusInjections(detail, regionData, constraintData)
    elif detail == 5:
        data, dataInfo = focusInjections(detail, regionData, constraintData)
    elif detail == 6:
        data, dataInfo = focusSignals(detail, regionData, constraintData)
    elif detail == 7:
        data, dataInfo = focusDetections(detail, regionData, constraintData)
    elif detail == 8:
        data, dataInfo = focusDetections(detail, regionData, constraintData)
    elif detail == 9:
        data, dataInfo = focusDetections(detail, regionData, constraintData)
    else:
        logging.error('Error in getting graphs')
    return [data, dataInfo]

"""Gets data about the specified function
Parameter - RelevantIndexes contains the index of the highlighted lines, relative to startLine"""
def getMachineInstructionData(func, relevantIndexes, startLine):
    relevantLines = []
    for i in range(len(relevantIndexes)):
        relevantLines.append(relevantIndexes[i] + startLine)
    currQuery = g.db.execute('SELECT COUNT(*) FROM (SELECT sites.site, sites.function FROM sites INNER JOIN injections ON sites.site = injections.site) ')
    numInjectionsInApplication = currQuery.fetchall()[0][0]
    currQuery = g.db.execute('SELECT COUNT(*) FROM (SELECT sites.site, sites.function FROM sites INNER JOIN injections ON sites.site = injections.site WHERE sites.function = ?) ', (func,))
    numInjectionsInFunction = currQuery.fetchall()[0][0]
    machineInstructionNumbers = []
    for i in range(len(relevantIndexes)):
        currQuery = g.db.execute("SELECT opcode, comment, type, site FROM sites WHERE function = ? and line = ?", (func,relevantLines[i]))
        result = currQuery.fetchall()  
        currLineInstructions = []
        currQuery = g.db.execute('SELECT COUNT(*) FROM (SELECT sites.site, sites.function FROM sites INNER JOIN injections ON sites.site = injections.site WHERE line = ?) ', (relevantLines[i],))
        numInjectionsInLine = currQuery.fetchall()[0][0]
        for j in range(len(result)):
            currInstruction = {}
            currOpCode = opcode2Str(int(result[j][0]))
            currInstruction['Opcode'] = currOpCode
            currInstruction['Comment'] = result[j][1]
            currInstruction['Type'] = result[j][2]
            currQuery = g.db.execute('SELECT COUNT(*) FROM (SELECT sites.site FROM sites INNER JOIN injections ON sites.site = injections.site WHERE sites.site = ?) ', (result[j][3],))
            lineCount = currQuery.fetchall()
            currInstruction['InjectionCount'] = lineCount[0][0]
            currInstruction['InjectionPercentageLine'] = lineCount[0][0]/float(numInjectionsInLine)
            currInstruction['InjectionPercentageFunction'] = lineCount[0][0]/float(numInjectionsInFunction)
            currInstruction['InjectionPercentageApplication'] = lineCount[0][0]/float(numInjectionsInApplication)
            currLineInstructions.append(currInstruction)
        machineInstructionNumbers.append(currLineInstructions)
    return machineInstructionNumbers, numInjectionsInFunction

"""Read in all data about function that we will display on the page"""
def readFunction(func):
    curQuery = g.db.execute("SELECT file, line FROM sites INNER JOIN injections ON sites.site = injections.site AND sites.function = ?", (func,))
    
    result = curQuery.fetchall()
    mainCodeOnly = False
    if len(result) == 0:
        mainCodeOnly = True
        curQuery = g.db.execute("SELECT file, line FROM sites WHERE sites.function = ?", (func,))
        result = curQuery.fetchall()
    lines = [i[1] for i in result] 
    file = result[0][0]
    if ".LLVM.txt" in file or "__NF" in file:
        file = result[-1][0]
    if not mainCodeOnly:
        minimum = np.min(lines)-1
        minimum = minimum if minimum >= 0 else 0
        maximum = np.max(lines)+1    
        bins = np.arange(minimum, maximum+1)
        values, bins = np.histogram(lines, bins, density=False) # <------------ check here
        bins = np.arange(minimum, maximum)
        values = 1.*values/np.sum(values)*100 # percents
        failedInjection = 0
        if minimum == 0:
            failedInjection = str(values[0])
            try:
                mask = np.all(np.equal(lines, 0), axis=1)
                minimum = np.min(lines[~mask]) - 1
            except ValueError:  #lines is empty? i.e. missing file it seems
                pass
            values = values[minimum:]

    sys.path.insert(0, '../')
    srcPath = readIdFromConfig("FaultSight", "srcPath")
    if os.path.isfile(file):
        srcPath = "" 
    if not os.path.isfile(srcPath+file):
        logging.warning("Warning (visInjectionsInCode): source file not found -- " +  str(srcPath) + str(file))
        return []
    logging.info("\nRelating injections to source code in file: " +  str(srcPath) + str(file))
    
    if not mainCodeOnly:
        # Getting 'relevant' lines of code
        FILE = open(srcPath+file, "r")
        function = FILE.readlines()[minimum:maximum]
        FILE.close()
        partialFunction = ""
        partialHighlightIndexes = []
        highlightMinimumValue = int(readIdFromConfig("FaultSight", "highlightValue"))
        for i in range(1,len(function)):
            if values[i] > int(highlightMinimumValue):
                partialFunction += addCustomLinkToLine(str2html(function[i-1]))
                partialHighlightIndexes.append(i-1)
            else:
                partialFunction += str2html(function[i-1])

    # Getting all code in function
    FILE = open(srcPath+file, "r")
    function = FILE.readlines()
    FILE.close()
    entireFunction = ""
    for i in range(1,len(function)):
        entireFunction += str2html(function[i-1])

    if mainCodeOnly:
        return [entireFunction]
    # Find what fraction of injections occured in this application
    currQuery = g.db.execute('SELECT COUNT(*) FROM (SELECT sites.site, sites.function FROM sites INNER JOIN injections ON sites.site = injections.site WHERE sites.function = ?) ', (func,))
    numInjectionsInFunction = currQuery.fetchall()
    currQuery = g.db.execute('SELECT COUNT(*) FROM (SELECT sites.site, sites.function FROM sites INNER JOIN injections ON sites.site = injections.site) ')
    numInjectionsInApplication = currQuery.fetchall()
    fractionOfApplication = float(numInjectionsInFunction[0][0])/float(numInjectionsInApplication[0][0])
    return [partialFunction, values, minimum + 1, partialHighlightIndexes, entireFunction, failedInjection, fractionOfApplication]


        
"""Adjusts the 'relevant' code
This is done to allow for special pop-up links when displayed on web page. Pop-up locations are marked using a custom tag."""
def addCustomLinkToLine(currLine):
    if "\n" in currLine:
        insertionIndex = currLine.index("\n")
        return FAULTSIGHT_CUSTOM_LINK_START + ' ' + currLine[:insertionIndex]  \
+ ' ' + FAULTSIGHT_CUSTOM_LINK_END + ' ' + currLine[insertionIndex:]
    else:
        return FAULTSIGHT_CUSTOM_LINK_START + ' ' + currLine + ' ' + FAULTSIGHT_CUSTOM_LINK_END
    
def str2html(s):
    """Replaces '<', '>', and '&' with html equlivants

    Parameters
    ----------
    s : str
        string to convert to a vaild html string to display properly
    """
    return s.replace("&", "&amp;").replace(">", "&gt;").replace("<", "&lt;")
       

def readIdFromConfig(section, id):
    config = ConfigParser.ConfigParser()
    config.read(app.config['CONFIG_PATH'])
    return config.get(section, id)

"""Read in config file settings"""
@app.route('/getSettingsFromFile', methods=['GET'])    
def getSettingsFromFile():
    config = ConfigParser.ConfigParser()
    config.read(app.config['CONFIG_PATH'])
    customConstraints = config._sections['CustomConstraint']
    highlightValue = config.get("FaultSight", "highlightValue")
    settingsDict = {
        'myGraphList': config.get("FaultSight", "myGraphList"), 
        'customConstraints':customConstraints,
        'highlightValue':highlightValue,
    }
    
    return jsonify(**settingsDict)
   
"""Save config file changes""" 
@app.route('/saveSettingsToFile', methods=['POST'])
def saveSettingsToFile():
    config = ConfigParser.ConfigParser()
    config.read(app.config['CONFIG_PATH'])
    config.set("FaultSight", "myGraphList", request.json['myGraphList'])
    config.set("FaultSight","highlightValue",request.json['highlightValue'])
    constraintDetails = request.json['customConstraints']
    constraintDetails = {}
    for k, v in request.json['customConstraints'].items():
        newList = []
        for item in v:
            item = str("\"") + str(item) + "\""
            newList.append(item)
        constraintDetails[k.encode('UTF8')] = "[" + ",".join(newList).encode("utf-8") + "]" if isinstance(newList, list) else newList.encode("utf-8")
    for k in constraintDetails.keys():
        config.set("CustomConstraint", k, constraintDetails[k])
    with open(app.config['CONFIG_PATH'], "wb") as config_file:
        config.write(config_file)
    return 'OK'

"""Creates a custom graph"""
@app.route('/createGraph', methods=['POST'])
def createGraph():
    focus =  request.json['focus']
    detail = request.json['detail']
    graphType = request.json['type']
    region = request.json['region']
    regionStart = request.json['regionStart']
    regionEnd = request.json['regionEnd']
    constraintData = request.json['constraintArray']
    regionData = {'Region':region, 'Start':regionStart,'End':regionEnd}

    g.db = connect_db()
    if focus == FOCUS_INJECTIONS:
        data, dataInfo = focusInjections(detail,regionData,constraintData)
    elif focus == FOCUS_SIGNALS:
        data, dataInfo = focusSignals(detail,regionData,constraintData)
    elif focus == FOCUS_DETECTIONS:
        data, dataInfo = focusDetections(detail,regionData,constraintData)
    else:
        return 'Error'
    return json.dumps([data,dataInfo])


"""Graphs with a focus on injections"""
def focusInjections(detail,regionData,constraintData):
    if detail == TYPE_OF_INJECTED_FUNCTION:
        return injectionClassification(regionData,constraintData)
    elif detail == BIT_LOCATION:
        return injectionBitLocation(regionData, constraintData)
    elif detail == INJECTED_FUNCTIONS:
        return injectionWhichFunction(regionData, constraintData)
    elif detail == INJECTION_TYPE_FUNCTION:
        return injectionsInEachFunction(regionData, constraintData)
    elif detail == INJECTIONS_MAPPED_TO_LINE:
        return injectionMappedToLine(regionData, constraintData)


"""Creates the component of the query string corresponding to the region of code we will query in database"""
def createRegionQueryString(regionData, useInputData=True):
    if useInputData == False:
        regionData = regionData = {'Region':"", 'Start':"",'End':""}
    # Entire Application
    if regionData['Region'] == "":
        return ""
    # Entire Function
    if regionData['Start'] == "":
        return "WHERE sites.function = '{}' ".format(regionData['Region'])
    # Specific Lines within function
    else:
        return "WHERE sites.function = '{}' AND sites.line BETWEEN {} AND {} ".format(regionData['Region'], regionData['Start'], regionData['End'])

"""Creates a new query that includes constraints"""
def createConstraintQueryString(constraintData, usedTables, originalQuery, regionQueryString, requiredConstraint):
    queryString = originalQuery
    for i in range(len(constraintData)):
        currConstraint = constraintData[i]
        currConstraint = {k.encode('utf8'): v.encode('utf8') for k, v in currConstraint.items()}
        if currConstraint['constraintTable'] not in usedTables:
            usedTables.append(currConstraint['constraintTable'])
            queryString += "INNER JOIN {} ON {}.trial=injections.trial ".format(currConstraint['constraintTable'], currConstraint['constraintTable'])
    queryString += regionQueryString  
    if requiredConstraint != "" and regionQueryString == "": 
        queryString += "WHERE " + requiredConstraint
    elif requiredConstraint != "" and regionQueryString != "":
        queryString += "AND " + requiredConstraint
    for i in range(len(constraintData)):
        queryString += "AND "
        currConstraint = constraintData[i]
        currConstraint = {k.encode('utf8'): v.encode('utf8') for k, v in currConstraint.items()}
        if currConstraint['constraintType'] == '1':
            queryString += "{}.{} = {} ".format(currConstraint['constraintTable'],currConstraint['constraintColumn'],currConstraint['constraintValue'])
        if currConstraint['constraintType'] == '2':
            queryString += "{}.{} != {} ".format(currConstraint['constraintTable'],currConstraint['constraintColumn'],currConstraint['constraintValue'])
        if currConstraint['constraintType'] == '3':
            queryString += "{}.{} > {} ".format(currConstraint['constraintTable'],currConstraint['constraintColumn'],currConstraint['constraintValue'])
        if currConstraint['constraintType'] == '4':
            queryString += "{}.{} >= {} ".format(currConstraint['constraintTable'],currConstraint['constraintColumn'],currConstraint['constraintValue'])
        if currConstraint['constraintType'] == '5':
            queryString += "{}.{} < {} ".format(currConstraint['constraintTable'],currConstraint['constraintColumn'],currConstraint['constraintValue'])
        if currConstraint['constraintType'] == '6':
            queryString += "{}.{} <= {} ".format(currConstraint['constraintTable'],currConstraint['constraintColumn'],currConstraint['constraintValue'])
    return queryString

"""GRAPH - Types of Injected Functions"""
def injectionClassification(regionData,constraintData):
    isEmpty=True
    typeBuckets = np.zeros(nClassifications + 1)
    usedTables = ['injections','sites']
    queryString = "SELECT sites.type FROM injections INNER JOIN sites ON sites.site = injections.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    injs = cur.fetchall()
    for i in range(len(injs)):
        isEmpty=False
        currType = injs[i][0]
        if currType in typeIdx:
            idx = typeIdx[currType]
            if idx == 6:
                logging.warning("Warning: mapping type (" + str(currType) + ") to type ( Control-Branch )")
                idx = 4
            typeBuckets[idx] += 1
            
        else:
            logging.warning("VIZ: not classified = " + str(i))
            typeBuckets[nClassifications] += 1
    d = []
    for i in range(nClassifications):
        d.append({'x':TYPES[i],'y':typeBuckets[i]})
    dataTypes = {'x':'Injection Type', 'y': 'Frequency', 'type':'single', 'isEmpty':isEmpty,'title':'Classification based on injection type'}
    return d, dataTypes

"""GRAPH - Bit Locations that have been injected into (Stacked bar)"""
def injectionBitLocation(regionData, constraintData):
    typeBuckets = np.zeros(nClassifications + 1)
    bitBuckets = np.zeros(8)
    bitFraction = np.zeros(9)
    bits =  np.zeros((nClassifications, 64))
    barbits =  np.zeros((nClassifications, 5))
    usedTables = ['injections','sites']
    queryString = "SELECT injections.site, injections.bit, sites.type FROM injections INNER JOIN sites ON sites.site = injections.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    injs = cur.fetchall()
    if len(injs) == 0:
        return [], {'isEmpty':True}
    maximum = max(injs)[0] +1
    locs = np.zeros((nClassifications, maximum))
    for i in range(len(injs)):
        currSite = injs[i][0]
        currBit = injs[i][1]
        currType = injs[i][2]
        if currType in typeIdx:
            idx = typeIdx[currType]
            if idx == 6:
                logging.warning("Warning: mapping type (" + str(currType) + ") to type ( Control-Branch )")
                idx = 4
            typeBuckets[idx] += 1
            locs[idx][currSite] += 1
            bits[idx][currBit] += 1
            barbits[idx][0] += 1
        else:
            logging.warning("VIZ: not classified = " + str(i))
            typeBuckets[nClassifications] += 1
    d = []
    for i in range(nClassifications):
        currVariableTypeInjections = []
        for j in range(64):
            currVariableTypeInjections.append({'x':j,'y':bits[i][j]})
        d.append(currVariableTypeInjections)
    barLabels = range(0,64)
    dataTypes = {'x':'Bit Location', 'y': 'Frequency', 'type':'multiple', 'layers':nClassifications,'samples':64, 'barLabels':barLabels, 'layerLabels':TYPES, 'isEmpty':False, 'title':'Classification of injections by bit'}
    return d, dataTypes
    

"""GRAPH - Percentages of what functions faults were injected into"""
def injectionWhichFunction(regionData, constraintData):
    usedTables = ['injections','sites']
    queryString = "SELECT DISTINCT function FROM sites INNER JOIN injections ON injections.site = sites.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    funcs = cur.fetchall()
    functionBucket = np.zeros((len(funcs)))
    np.atleast_2d(functionBucket)
    d = []
    isEmpty=True
    for index, item in enumerate(funcs):
        queryString = "SELECT COUNT(trial) FROM injections INNER JOIN sites ON sites.site = injections.site AND sites.function = '{}' ".format(item[0])
        queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
        cur = g.db.execute(queryString)
        currItem = cur.fetchone()[0]
        functionBucket[index] = int(currItem)
        isEmpty=False
    for i in range(len(funcs)):
        d.append({'x':funcs[i][0],'y':functionBucket[i]})
    dataTypes = {'x':'Function', 'y': 'Injections', 'type':'single', 'isEmpty':isEmpty,'title':'Injected functions'}
    return d, dataTypes




"""GRAPH - Injection Type per Function (Stacked bar)"""
def injectionsInEachFunction(regionData, constraintData):
    usedTables = ['injections','sites']
    queryString = "SELECT DISTINCT function FROM sites INNER JOIN injections ON injections.site = sites.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    funcs = cur.fetchall()
    totalDict = {}
    funcList = []
    isEmpty=True
    for i in funcs:
        i = i[0]
        funcList.append(i)
        currFunctionFreq = []
        usedTables = ['injections','sites']
        queryString = "SELECT type FROM sites INNER JOIN injections ON sites.site = injections.site AND sites.function = '{}' ".format(i)
        queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData, False), "")
        cur = g.db.execute(queryString)
        types = cur.fetchall()
        tot = float(len(types))
        per = np.zeros(nClassifications)
        per = [ 0 for j in xrange(nClassifications)]
        totalDict[i] = []
        for t in types:
            idx = typeIdx[t[0]]
            if idx == 6:
                logging.warning("Warning: mapping type ( Control ) to type ( Control-Branch )")
                idx = 4
            per[idx] += 1
            isEmpty=False
        totalDict[i] = (per)
    returnData = []
    for i in range(nClassifications):
        currVariableTypeInjections = []
        for index, f in enumerate(funcs):
            currVariableTypeInjections.append({'x':f[0],'y':totalDict[f[0]][i]})
        returnData.append(currVariableTypeInjections)
    dataTypes = {'x':'Function', 'y': 'Frequency of injections', 'type':'multiple', 'layers':nClassifications,'samples':len(funcs), 'barLabels':funcList, 'isEmpty':isEmpty,'title':'Injection type per function'}
    return returnData, dataTypes



    
"""GRAPH - Injections Mapped to Line Numbers"""
def injectionMappedToLine(regionData, constraintData):
    usedTables = ['injections','sites']
    queryString = "SELECT DISTINCT function FROM sites INNER JOIN injections ON injections.site = sites.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    functions = cur.fetchall()
    for i in functions:
        #lets use 5 bins for the pie chart
        pieBins = np.zeros(5)
        i = i[0]
        # grab all injections in this function
        usedTables = ['injections','sites']
        queryString = "SELECT file, line FROM sites INNER JOIN injections ON sites.site = injections.site AND sites.function = '{}' ".format(i)
        queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
        cur = g.db.execute(queryString)
        result = cur.fetchall()
        if len(result) == 0:
            logging.warning("Warning (visInjectionsInCode): no injections in target function -- " + str(func))
            return [], {'isEmpty':True}
        # locate the min and max source line num to shrink output file size
        # we only want to show the section of code that we inject in
        lines = [i[1] for i in result] 
        file = result[0][0]
        if ".LLVM.txt" in file:
            file = result[-1][0]
        minimum = np.min(lines)-1
        minimum = minimum if minimum >= 0 else 0
        maximum = np.max(lines)+1
        bins = np.arange(minimum, maximum+1)    
        values, bins = np.histogram(lines, bins, density=False) # <------------ check here
        bins = np.arange(minimum, maximum)
        values = 1.*values/np.sum(values)*100 # percents
        d = []
        for i in range(len(bins)):
            d.append({'x':i+minimum,'y':values[i]})
        dataTypes = {'x':'Line Number', 'y': 'Frequency', 'type':'single', 'isEmpty':False, 'title':'Injections mapped to line numbers'}
        return d, dataTypes

def focusSignals(detail,regionData,constraintData):
    if detail == UNEXPECTED_TERMINATION:
        return signalUnexpectedTermination(regionData, constraintData)


"""GRAPH - Unexpected Termination"""
"""Graphs percentage of trials that crashed, and bit location and type
    of the corresponding injection"""
def signalUnexpectedTermination(regionData, constraintData):
    isEmpty=True
    bits =  np.zeros((nClassifications, 64))
    usedTables = ['injections','sites', 'trials']
    queryString = "SELECT type FROM sites INNER JOIN injections ON sites.site = injections.site INNER JOIN trials ON trials.trial = injections.trial AND trials.crashed = 1 "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    crash = cur.fetchall()
    crashed = float(len(crash))
    usedTables = ['injections','sites', 'trials']
    queryString = "SELECT injections.site, injections.bit  FROM injections INNER JOIN trials ON injections.trial = trials.trial AND trials.crashed = 1 INNER JOIN sites ON sites.site = injections.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    sitesBits = cur.fetchall()    
    for i in range(len(sitesBits)):
        type = crash[i][0]
        bit = sitesBits[i][1]
        #bits[typeIdx[type]][bit] += 1
        idx = typeIdx[type]
        if idx == 6:
            logging.warning("Warning: mapping type ( Control ) to type ( Control-Branch )")
            idx = 4
        bits[idx][bit] += 1
        isEmpty=False
    returnData = []
    for bitIdx in range(bits.shape[1]):
        currBitFrequency = []
        for injectionType in range(bits.shape[0]):
            currBitFrequency.append({'x':TYPES[injectionType],'y':bits[injectionType][bitIdx]})
        returnData.append({'x':bitIdx,'y':currBitFrequency})
    returnData = []
    for i in range(bits.shape[0]):
        currInjectionType = []
        for j in range(bits.shape[1]):
            currInjectionType.append({'x':j,'y':bits[i][j]})
        returnData.append(currInjectionType)
    barLabels = range(bits.shape[1])
    dataTypes = {'x':'Line Number', 'y': 'Frequency', 'type':'multiple', 'layers':bits.shape[0], 'samples':bits.shape[1], 'barLabels':barLabels, 'isEmpty':isEmpty,'title':'Unexpected Termination'}
    return returnData, dataTypes


def focusDetections(detail,regionData,constraintData):
    if detail == NUM_TRIAL_WITH_DETECTION:
        return detectionsNumTrialsWithDetection(regionData,constraintData)
    elif detail == DETECTED_BIT_LOCATION:
        return detectionsBitLocation(regionData,constraintData)
    elif detail == DETECTION_LATENCY:
        return detectionsLatency(regionData,constraintData)

"""Number of Trials with detection"""
"""Graphs the percentage of trials that generate detection """
"""Assumes one injection per trial."""
def detectionsNumTrialsWithDetection(regionData,constraintData):
    detectionBar = np.zeros((2,2))
    np.atleast_2d(detectionBar)
    usedTables = ['injections','sites','trials']
    queryString = "SELECT COUNT(trials.trial) FROM trials INNER JOIN injections ON injections.trial = trials.trial INNER JOIN sites ON sites.site = injections.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "detection = 1 ")
    cur = g.db.execute(queryString)
    detected = float(cur.fetchone()[0])
    usedTables = ['injections','sites', 'trials']
    queryString = "SELECT SUM(numInj) FROM trials INNER JOIN injections ON injections.trial = trials.trial INNER JOIN sites ON sites.site = injections.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    numInj = float(cur.fetchone()[0])
    isEmpty=True
    if numInj!=0:
        isEmpty=False
    detectionBar[0][0] += detected
    detectionBar[1][0] += (numInj - detected)
    returnData = []
    returnData.append({'x':'Detected','y':detectionBar[0][0]})
    returnData.append({'x':'Not Detected', 'y':detectionBar[1][0]})
    dataTypes = {'x':'Detection Status', 'y': 'Number of Injections', 'type':'single', 'isEmpty':isEmpty,'title':'Number of trials with detection'}
    return returnData, dataTypes


def detectionsBitLocation(regionData, constraintData):
    """Graphs bit locations and type of what injections were detected
    
    Parameters
    ----------
    c : object
        sqlite3 database handle that is open to a valid filled database

    moreDetail : list of str
        function names to generate extra analysis of detections inside them
    Notes
    ----------
    TODO: add graphs for more detail option
    TODO: visualize injection sites detected
    TODO: visualize injection types detected
    Allows for user custom visualzations after first 'plot.show()'
    """

    bits =  np.zeros((nClassifications,64))
    usedTables = ['injections','sites','trials']
    queryString = "SELECT injections.site, injections.bit  FROM injections INNER JOIN trials ON injections.trial = trials.trial AND trials.detection = 1 INNER JOIN sites ON sites.site = injections.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    injs = cur.fetchall()
    usedTables = ['injections','sites','trials']
    queryString = "SELECT type FROM sites INNER JOIN injections ON sites.site = injections.site INNER JOIN trials ON injections.trial = trials.trial AND trials.detection = 1 "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    types = cur.fetchall()
    isEmpty=True
    for i in range(len(injs)):
        type = types[i][0]
        site = injs[i][0]
        bit = injs[i][1]
        #bits[typeIdx[type]][bit] += 1
        idx = typeIdx[type]
        if idx == 6:
            logging.warning("Warning: mapping type ( Control ) to type ( Control-Branch )")
            idx = 4
        bits[idx][bit] += 1
        isEmpty=False
    returnData = []
    for i in range(bits.shape[0]):
        currInjectionType = []
        for j in range(bits.shape[1]):
            currInjectionType.append({'x':j,'y':bits[i][j]})
        returnData.append(currInjectionType)
    barLabels = range(bits.shape[1])
    dataTypes = {'x':'Line Number', 'y': 'Frequency', 'type':'multiple', 'layers':bits.shape[0], 'samples':bits.shape[1], 'barLabels':barLabels, 'isEmpty':isEmpty,'title':'Detected Injection bit location'}
    return returnData, dataTypes



def detectionsLatency(regionData, constraintData):
    """Visualizes the detection latency of an injection in the form of
    a bar chart with the x-axis as number of instruction executed after
    injection.
    
    Parameters
    ----------
    c : object
        sqlite3 database handle that is open to a valid filled database
    
    Notes
    ----------
    Assumes the user modifed the latency value in the detections table. It can
    be calucated by the
    'LLVM_dynamic_inst_of_detection - LLVM_dynamic_inst_of_injection'.
    The later can be obtained from the injection table for the trial, and the
    former can be obtained at detection time though the FlipIt API call
    'FLIPIT_GetDynInstCount()'.
    """
    #TODO: Extend to look at latency for each detector
    usedTables = ['injections','sites','detections']
    queryString = "SELECT detections.latency FROM detections INNER JOIN injections ON injections.trial = detections.trial INNER JOIN sites ON sites.site = injections.site "
    queryString = createConstraintQueryString(constraintData, usedTables, queryString, createRegionQueryString(regionData), "")
    cur = g.db.execute(queryString)
    buckets = [-1, 0, 1, 2, 3, 4, 5, 10, 1e2, 1e3, 1e9, 1e13]
    data = [ i[0] for i in cur.fetchall()]
    values, bins = np.histogram(data, buckets, normed=False)
    xlabel = "# of instrumented LLVM instructions till detection"
    ylabel = "Frequency"
    ticks = ["-1", "0", "1", "2", "3", "4", "5->", "10->", "1e2->", "1e3->", "1e9->"]
    bins = np.arange(0,11)
    isEmpty=True
    returnData = []
    for i in range(len(values)):
        returnData.append({'x':ticks[i],'y':values[i]})
        if values[i]!=0:
            isEmpty=False
    dataTypes = {'x':'Instructions executed after injection', 'y': 'Frequency', 'type':'single', 'isEmpty':isEmpty,'title':'Detection latency'}
    return returnData, dataTypes


""" Stolen from Jon's FlipIt source code - binaryParser.py"""
def opcode2Str(opcode):
    """Converts an opcode into an ASCII string.
    Parameters
    ----------
    opcode : int
        opcode to express as a string
    """

    INST_STR = ["Unknown", "Ret", "Br", "Switch", "IndirectBr", "Invoke", "Resume",\
    "Unreachable", "Add", "FAdd", "Sub", "FSub", "Mul", "FMul", "UDiv", "SDiv",\
    "FDiv", "URem", "SRem", "FRem", "Shl", "LShr", "Ashr", "And", "Or", "Xor", \
    "Alloca", "Load", "Store", "GetElementPtr", "Fence", "AtomicCmpXchg", \
    "AtomicRMW", "Truc", "ZExt", "SExt", "FPToUI", "FPToSI", "UIToFP", "SIToFP",\
    "FPTrunc", "FPExt", "PtrToInt", "IntToPtr", "BitCast", "AddrSpaceCast", \
    "ICmp", "FCmp", "PHI", "Call", "Select", "UserOp1", "UserOp2", "VAArg", \
    "ExtractElement", "InsertElement", "ShuffleVector", "ExtractValue", \
    "InsertValue", "LandingPad"]

    if opcode < len(INST_STR):
        return INST_STR[opcode]
    else: 
        return INST_STR[0]
    
if __name__ == '__main__':
    print('Please run this application through web.py')
