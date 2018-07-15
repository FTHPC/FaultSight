from faultSight.database import db, relevant_tables, sites, trials, injections, detections, table_mapping, signals
from faultSight.constants import *
from faultSight.utils import *

from flask import json
from sqlalchemy import and_
from sqlalchemy import func as sqlFunc

import logging
import numpy as np


# Example of contraint_data
#
# Assumes that selected table has a 'trial' entry
#
# x = {
#    'table': injections,
#    'type' : 1,
#    'column': injections.bit,
#    'value' : 0,
# }
#



# Getting graphs

"""Get a list of 'My Graph' graph data (These are specified in config file)"""
def get_my_graphs(function_name):
    my_graph_array = json.loads(read_id_from_config("FaultSight", "myGraphList"))
    my_graph_list = []
    region_data = generate_region_object(region = function_name)
    for i in range(len(my_graph_array)):
        generated_graph = get_graph(my_graph_array[i],region_data)
        my_graph_list.append(generated_graph)
    return my_graph_list



"""Gets the specific requested graph"""
def get_graph(graph_type,region_data,constraint_data = {}):

    # Injections category
    if graph_type == TYPE_OF_INJECTED_FUNCTION:
        return injection_classification(region_data, constraint_data)
    elif graph_type == BIT_LOCATION:
        return injection_bit_location(region_data, constraint_data)
    elif graph_type == INJECTED_FUNCTIONS:
        return injection_which_function(region_data, constraint_data)
    elif graph_type == INJECTION_TYPE_FUNCTION:
        return injections_in_each_function(region_data, constraint_data)
    elif graph_type == INJECTIONS_MAPPED_TO_LINE:
        return injection_mapped_to_line(region_data, constraint_data)

    # Signals category
    elif graph_type == UNEXPECTED_TERMINATION:
        return signal_unexpected_termination(region_data, constraint_data)

    # Detections category
    elif graph_type == NUM_TRIAL_WITH_DETECTION:
        return detections_num_trials_with_detection(region_data, constraint_data)
    elif graph_type == DETECTED_BIT_LOCATION:
        return detections_bit_location(region_data, constraint_data)
    elif graph_type == DETECTION_LATENCY:
        return detections_latency(region_data, constraint_data)
    else:
        logging.error("Error in getting graphs" + str(graph_type))
        return [[],[]]




# Query filters


""" Updated the query, filtering on user specified region and constraint"""
def query_filter(query, region_data, constraint_data):

    # Join each of the custom tables on 'trial' column
    for constraint in constraint_data:
        joined_tables = [mapper.class_.__table__.name for mapper in query._join_entities]
        print joined_tables
        if constraint['table'] in joined_tables:
            break
        if constraint['table'] == 'trials':
            query = query.join(trials, trials.trial == injections.trial)
        elif constraint['table']  == 'signals':
            query = query.join(trials, trials.trial == injections.trial)
            query = query.join(signals, signals.trial == trials.trial)
        elif constraint['table']  == 'detections':
            query = query.join(trials, trials.trial == injections.trial)
            query = query.join(detections, detections.trial == trials.trial)

    # Region filter
    query = filter_query_on_region(region_data, query)

    for constraint in constraint_data:
        # First we access the column object
        table = table_mapping[constraint['table']].__table__
        col = table.c[constraint['column']]

        if constraint['type'] == '1':
            query = query.filter(col == constraint['value'])
        if constraint['type'] == '2':
            query = query.filter(col != constraint['value'])
        if constraint['type'] == '3':
            query = query.filter(col > constraint['value'])
        if constraint['type'] == '4':
            query = query.filter(col >= constraint['value'])
        if constraint['type'] == '5':
            query = query.filter(col < constraint['value'])
        if constraint['type'] == '6':
            query = query.filter(col <= constraint['value'])

    return query

# Creates the component of the query string corresponding to the region of code we will query in database
def filter_query_on_region(region_data, query):
    # Entire Application
    if region_data['Region'] == "":
        return query
    # Entire Function
    if region_data['Start'] == "":
        return query.filter(sites.func == region_data['Region'])
    # Specific Lines within function
    else:
        return query.filter(sites.func == region_data['Region'])\
                    .filter(sites.line >= region_data['Start'])\
                    .filter(sites.line <= region_data['End'])



# GRAPHS


"""GRAPH - Types of Injected Functions"""
def injection_classification(region_data,constraint_data):

    title = 'Classification based on injection type'
    title_edited = False

    type_buckets = np.zeros(nClassifications + 1)

    # The basic query
    query = db.session.query(injections)\
        .join(sites, sites.siteId==injections.siteId)

    # Filter the query on region and constraint
    query = query_filter(query, region_data, constraint_data)

    # Print query for testing purposes
    print(query.statement.compile(dialect=db.session.bind.dialect))

    # Request the specifc values we are interested in
    query = query.values(sites.type)

    # Create a list of injected types
    injected_types = []
    for item in query:
       injected_types.append(item.type)

    # Calculate how many of each type there are
    for injected_type in injected_types:
        if injected_type in typeIdx:
            idx = typeIdx[injected_type]
            if idx == 6:
                logging.warning("Warning: mapping type (" + str(injected_type) + ") to type ( Control-Branch )")
                idx = 4
            type_buckets[idx] += 1

        else:
            logging.warning("Unknown injection type. Incrementing injection type for last item in type_buckets instead.")
            type_buckets[nClassifications - 1] += 1

            if title_edited == False:
                title += " - Error: Unknown injection type found. Check that the types in the database and constants.py match."
                title_edited = True

    # Store data in appropriate dictionary
    data = []
    for i in range(len(TYPES)):
        data.append({'x':TYPES[i],'y':type_buckets[i]})

    # Graph information dictionary
    graph_info = {
        'x':'Injection Type',
        'y': 'Frequency',
        'type':'single',
        'isEmpty':len(injected_types) == 0,
        'title':title
        }
    return [data, graph_info]

"""GRAPH - Bit Locations that have been injected into (Stacked bar)"""
def injection_bit_location(region_data, constraint_data):
    bits = np.zeros((nClassifications, 64))

    # Basic query
    query = db.session.query(injections)\
        .join(sites, sites.siteId==injections.siteId)

    # Filter the query on region and constraint
    query = query_filter(query, region_data, constraint_data)

    # Request the values we want
    query = query.values(sites.type,injections.bit)

    # Pick up the relevant items and store them
    injection_info = []
    for item in query:
        item_dict = {
            'bit' : item.bit,
            'type': item.type,
        }
        injection_info.append(item_dict)

    # If there were no injections, just return an empty dataset
    if len(injection_info) == 0:
        return [[], {'isEmpty':True, 'title':'Classification of injections by bit'}]

    # Go through each injection, categorizing it into bit and injection type
    for injection_item in injection_info:
        curr_bit = injection_item['bit']
        curr_type = injection_item['type']
        if curr_type in typeIdx:
            idx = typeIdx[curr_type]
            if idx == 6:
                logging.warning("Warning: mapping type (" + str(curr_type) + ") to type ( Control-Branch )")
                idx = 4
            bits[idx][curr_bit] += 1
        else:
            logging.warning("Current type not found in type index! Was the database generated correctly?")
            return [[], {'isEmpty':True, 'title':'Classification of injections by bit - Error: Invalid injection type found'}]

    # Store the data in our return array
    data = []
    for i in range(nClassifications):
        curr_variable_type_injections = []
        for j in range(64):
            curr_variable_type_injections.append({'x':j,'y':bits[i][j]})
        data.append(curr_variable_type_injections)

    # Graph information dictionary
    graph_info = {
        'x':'Bit Location',
        'y': 'Frequency',
        'type':'multiple',
        'layers':nClassifications,
        'samples':64,
        'barLabels':range(0,64),
        'layerLabels':TYPES,
        'isEmpty':False,
        'title':'Classification of injections by bit'
    }

    return [data, graph_info]


"""GRAPH - Percentages of what functions faults were injected into

    Tables used: injections, sites

"""
def injection_which_function(region_data, constraint_data):

    # The building block of our query
    query = db.session.query(sites)\
        .join(injections, sites.siteId==injections.siteId)\
        .distinct(sites.func)\
        .group_by(sites.func)

    # Filter the query on region and constraint
    query = query_filter(query, region_data, constraint_data)

    # Execute the query, store the results
    injected_functions = []
    for item in query:
       injected_functions.append(item.func)


    data = []

    for index, function in enumerate(injected_functions):
        # Same as before, we generate the basic query...
        query = db.session.query(injections)\
            .join(sites, and_(sites.siteId==injections.siteId, sites.func == function))

        # ... and then filter on region and constraints
        query = query_filter(query, region_data, constraint_data)

        # We want to store a count of how many result entries there are

        dataItem = {
            'x':function,
            'y':query.count()
        }
        data.append(dataItem)

    graph_info = {
        'x':'Function',
        'y': 'Injections',
        'type':'single',
        'isEmpty':(len(data) == 0),
        'title':'Injected functions'
    }
    return [data, graph_info]


"""GRAPH - Injection Type per Function (Stacked bar)"""
def injections_in_each_function(region_data,constraint_data):
    usedTables = ['injections','sites']

    # The building block of our query
    query = db.session.query(sites)\
        .join(injections, sites.siteId==injections.siteId)\
        .distinct(sites.func)\
        .group_by(sites.func)

    # Filter the query on region and constraint
    query = query_filter(query, region_data, constraint_data)

    # Execute the query, store the results
    injected_functions = []
    for item in query:
       injected_functions.append(item.func)


    # If there were no injections, just return an empty dataset
    if len(injected_functions) == 0:
        return [[], {'isEmpty':True, 'title':'Injection type per function'}]


    # Dict we will be storing the parsed data in
    total_dict = {}

    for func in injected_functions:

        # The building block of our query
        query = db.session.query(injections)\
            .join(sites, sites.siteId==injections.siteId)\
            .filter(sites.func == func)

        # Filter the query on region and constraint
        query = query_filter(query, region_data, constraint_data)

        # Request the specifc values we are interested in
        query = query.values(sites.type)

        # Execute the query, store the results
        injected_types = []
        for item in query:
           injected_types.append(item.type)

        # Parse the data, figure out the different types of injections in this function
        injection_buckets = [ 0 for j in xrange(nClassifications)]
        for injected_type in injected_types:
            if injected_type in typeIdx:
                idx = typeIdx[injected_type]
                if idx == 6:
                    logging.warning("Warning: mapping type ( Control ) to type ( Control-Branch )")
                    idx = 4
                injection_buckets[idx] += 1
            else:
                logging.warning("Current type not found in type index! Was the database generated correctly?")
                return [[], {'isEmpty':True, 'title':'Injection type per function - Error: Invalid injection type found'}]

        total_dict[func] = injection_buckets

    data = []
    # Turn the parsed data into the format we use in d3
    for i in range(nClassifications):
        curr_variable_type_injections = []
        for index, func in enumerate(injected_functions):
            curr_variable_type_injections.append({'x':func,'y':total_dict[func][i]})
        data.append(curr_variable_type_injections)

    graph_info = {
        'x':'Function',
        'y': 'Frequency of injections',
        'type':'multiple',
        'layers':nClassifications,
        'samples':len(injected_functions),
        'barLabels':injected_functions,
        'isEmpty':False,
        'title':'Injection type per function'
    }

    return [data, graph_info]



"""GRAPH - Injections Mapped to Line Numbers"""
def injection_mapped_to_line(region_data,constraint_data):

    # The building block of our query
    query = db.session.query(sites)\
        .join(injections, sites.siteId==injections.siteId)\
        .distinct(sites.func)\
        .group_by(sites.func)

    # Filter the query on region and constraint
    query = query_filter(query, region_data, constraint_data)

    # Execute the query, store the results
    injected_functions = []
    for item in query:
       injected_functions.append(item.func)


    for func in injected_functions:

        # Grab all injections in this function, the building block of our query
        query = db.session.query(injections)\
            .join(sites, sites.siteId==injections.siteId)\
            .filter(sites.func == func)

        # Filter the query on region and constraint
        query = query_filter(query, region_data, constraint_data)

        print("QUERY")
        print(query)
        # Request the specifc values we are interested in
        query = query.values(sites.line)

        # Execute the query, store the results
        injected_lines = []
        for item in query:
            injected_lines.append(item.line)


        if len(injected_lines) == 0:
            logging.warning("Warning (injection_mapped_to_line): no injections in target function -- " + str(func))
            return [[], {'isEmpty':True, 'title':'Injections mapped to line numbers - Function: {0}'.format(func)}]


        # locate the min and max source line num to shrink output file size
        # we only want to show the section of code that we inject in
        minimum = np.min(injected_lines)-1
        minimum = minimum if minimum >= 0 else 0
        maximum = np.max(injected_lines)+1
        bins = np.arange(minimum, maximum+1)
        values, bins = np.histogram(injected_lines, bins, density=False) # <------------ check here
        bins = np.arange(minimum, maximum)
        data = []
        for i in range(len(bins)):
            data.append({'x':(i + minimum),'y':values[i]})

        graph_info = {
            'x':'Line Number',
            'y': 'Frequency',
            'type':'single',
            'isEmpty':False,
            'title':'Injections mapped to line numbers - Function: {0}'.format(func)
        }
        return [data, graph_info]

    # If there were no functions injected into whatsoever
    return [[], {'isEmpty':True, 'title':'Injections mapped to line numbers - No Injected functions'}]

"""GRAPH - Unexpected Termination"""
"""Graphs trials that crashed - bit location and type of corresponding injection"""
def signal_unexpected_termination(region_data,constraint_data):

    bits =  np.zeros((nClassifications, 64))

    # The building block of our query
    query = db.session.query(injections)\
        .join(sites, sites.siteId==injections.siteId)\
        .join(trials, trials.trial == injections.trial)\
        .filter(trials.crashed == 1)

    # Filter the query on region and constraint
    query = query_filter(query, region_data, constraint_data)

    # Request the specifc values we are interested in
    query = query.values(sites.type, injections.bit)

    # Get data from database
    crash_info = []
    for item in query:
        crash_item = {
            'type': item.type,
            'bit': item.bit
        }
        crash_info.append(crash_item)

    # Parse the data
    for crash_item in crash_info:
        crash_type = crash_item['type']
        crash_bit = crash_item['bit']
        idx = typeIdx[crash_type]
        if idx == 6:
            logging.warning("Warning: mapping type ( Control ) to type ( Control-Branch )")
            idx = 4
        bits[idx][crash_bit] += 1

    # Prepare for stacked d3 chart
    data = []
    for i in range(nClassifications):
        curr_variable_type_termination = []
        for j in range(64):
            curr_variable_type_termination.append({'x':j,'y':bits[i][j]})
        data.append(curr_variable_type_termination)



    graph_info = {
        'x':'Bit',
        'y': 'Frequency',
        'type':'multiple',
        'layers':bits.shape[0],
        'samples':bits.shape[1],
        'barLabels':range(bits.shape[1]),
        'isEmpty':(len(crash_info) == 0),
        'title':'Unexpected Termination'
    }

    return [data, graph_info]


"""Number of Trials with detection"""
"""Graphs the percentage of trials that generate detection """
"""Assumes one injection per trial."""
def detections_num_trials_with_detection(region_data,constraint_data):

    # Get number of detected trials
    query = db.session.query(sites)\
        .join(injections, sites.siteId==injections.siteId)\
        .join(trials,trials.trial == injections.trial)\
        .filter(trials.detected == 1)
    query = query_filter(query, region_data, constraint_data)
    detected = query.count()

    # Get number of injections
    query = db.session.query(sites)\
        .join(injections, sites.siteId==injections.siteId)\
        .join(trials,trials.trial == injections.trial)
    query = query_filter(query, region_data, constraint_data)
    num_inj = query.with_entities(sqlFunc.sum(trials.numInj)).scalar()

    if num_inj == None:
        num_inj = 0

    data = []
    data.append({'x':'Detected','y':detected})
    data.append({'x':'Not Detected', 'y':(num_inj - detected)})

    graph_info = {
        'x':'Detection Status',
        'y': 'Number of Injections',
        'type':'single',
        'isEmpty':num_inj == 0,
        'title':'Number of trials with detection'
    }

    return [data, graph_info]


def detections_bit_location(region_data,constraint_data):
    """Graphs bit locations and type of what injections were detected

    Parameters
    ----------
    c : object
        sqlite3 database handle that is open to a valid filled database

    moreDetail : list of str
        function names to generate extra analysis of detections inside them
    """

    bits =  np.zeros((nClassifications,64))

    # The building block of our query
    query = db.session.query(injections)\
        .join(sites, sites.siteId==injections.siteId)\
        .join(trials, and_(trials.trial == injections.trial, trials.detected == 1))

    # Filter the query on region and constraint
    query = query_filter(query, region_data, constraint_data)

    # Get the columns we are interested in
    query = query.values(sites.type, injections.bit)

    # Execute the query, store the results
    detection_info = []
    for item in query:
        detection_item = {
            'bit': item.bit,
            'type': item.type,
        }
        detection_info.append(detection_item)



    # Parsing the data
    for detection_item in detection_info:
        detected_type = detection_item['type']
        detected_bit = detection_item['bit']
        idx = typeIdx[detected_type]
        if idx == 6:
            logging.warning("Warning: mapping type ( Control ) to type ( Control-Branch )")
            idx = 4
        bits[idx][detected_bit] += 1

    # Preparing the data for stacked d3
    data = []
    for i in range(bits.shape[0]):
        currInjectionType = []
        for j in range(bits.shape[1]):
            currInjectionType.append({'x':j,'y':bits[i][j]})
        data.append(currInjectionType)

    graph_info = {
        'x':'Line Number',
        'y': 'Frequency',
        'type':'multiple',
        'layers':bits.shape[0],
        'samples':bits.shape[1],
        'barLabels':range(bits.shape[1]),
        'isEmpty':(len(detection_info) == 0),
        'title':'Detected Injection bit location'
    }

    return [data, graph_info]



def detections_latency(region_data,constraint_data):
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

    # The building block of our query
    query = db.session.query(detections)\
        .join(injections, injections.trial == detections.trial)\
        .join(sites, sites.siteId==injections.siteId)

    # Filter the query on region and constraint
    query = query_filter(query, region_data, constraint_data)

    # Execute the query, store the results
    latency_info = []
    for item in query:
        bit_info.append(item.latency)

    # Generate histogram data
    buckets = [-1, 0, 1, 2, 3, 4, 5, 10, 1e2, 1e3, 1e9, 1e13]
    values, bins = np.histogram(latency_info, buckets, normed=False)
    ticks = ["-1", "0", "1", "2", "3", "4", "5->", "10->", "1e2->", "1e3->", "1e9->"]
    bins = np.arange(0,11)
    isEmpty=True

    # Prepare data for d3
    data = []
    for i in range(len(values)):
        data.append({'x':ticks[i],'y':values[i]})
        if values[i]!=0:
            isEmpty=False

    graph_info = {
        'x':'# of instrumented LLVM instructions till detection',
        'y': 'Frequency',
        'type':'single',
        'isEmpty':isEmpty,
        'title':'Detection latency'
    }

    return [data, graph_info]
