from faultSight import app
from faultSight.database import db, relevant_tables, trials, sites
from faultSight.constants import *

from sqlalchemy.engine import reflection
from sqlalchemy import func as sqlFunc

import ConfigParser




"""Creates a dict containing tables, columns, and column data types"""
def get_database_tables():

    # dict of 'tableName -> table_dict'
    database_dict = {}

    # Inspector allows us to inspect tables in database
    insp = reflection.Inspector.from_engine(db.engine)

    # database.py provides us with a array of table names
    for table in relevant_tables:

        # table_dict of 'columnName -> columnType'
        table_dict = {}

        for column in insp.get_columns(table):

            column_name = column['name']
            column_type = column['type']
            table_dict[column_name] = str(column_type)

        database_dict[table] = table_dict

    return database_dict




"""Generates a config parser and connects to the provided config file"""
def generate_config_parser():
    config = ConfigParser.ConfigParser()
    config.read(app.config['CONFIG_PATH'])
    return config



def is_valid_function(functionName):
    return functionName in app.config['FUNCTIONS']



def read_lines_from_file(file_path, start_line = 0, end_line = 0):
    FILE = open(file_path, "r")
    file_lines = FILE.readlines()
    FILE.close()

    # Adjust return lines if specified
    if start_line != 0 and end_line != 0:
      file_lines = file_lines[start_line - 1:end_line - 1]

    return file_lines


def read_id_from_config(section, id):
    config = ConfigParser.ConfigParser()
    config.read(app.config['CONFIG_PATH'])
    raw_value = config.get(section, id)
    if raw_value == "True":
        raw_value = True
    elif raw_value == "False":
        raw_value = False
    return raw_value

"""Adjusts the 'relevant' code
This is done to allow for special pop-up links when displayed on web page. Pop-up locations are marked using a custom tag.
given `line`, output <FaultSightStart>line</FaultSightStart>
"""
def add_custom_link_to_line(line):
    if "\n" in line:
        insertion_index = line.index("\n")
        return FAULTSIGHT_CUSTOM_LINK_START + ' ' + line[:insertion_index]  \
            + ' ' + FAULTSIGHT_CUSTOM_LINK_END + ' ' + line[insertion_index:]
    else:
        return FAULTSIGHT_CUSTOM_LINK_START + ' ' + line + ' ' + FAULTSIGHT_CUSTOM_LINK_END

# Stolen from Jon
def str2html(s):
    """Replaces '<', '>', and '&' with html equlivants

    Parameters
    ----------
    s : str
        string to convert to a vaild html string to display properly
    """
    return s.replace("&", "&amp;").replace(">", "&gt;").replace("<", "&lt;")


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



def generate_region_object(region = "", start = "", end = ""):
    region_object = {
                     'Region':region,
                     'Start':start,
                     'End':end
                    }
    return region_object


def inequality_test_of_proportions(p1_num, p1_denom, p2_num, p2_denom):

    if p1_denom == 0 or p2_denom == 0:
        return "Unable to determine", 0.0, 0.0, 0.0

    n_1 = p1_num * 1.0
    d_1 = p1_denom * 1.0

    n_2 = p2_num * 1.0
    d_2 = p2_denom * 1.0

    p_1 = n_1 / d_1
    p_2 = n_2 / d_2

    p_combined = (n_1 + n_2) / (d_1 + d_2)

    numerator = p_1 - p_2

    import numpy
    denominator = numpy.sqrt(p_combined * (1 - p_combined) * ( (1.0 / d_1) + (1.0 / d_2) ))

    if denominator == 0:
        return "Unable to determine", p_1, p_2, 0.0

    z = numerator / denominator

    import scipy.stats
    p_val = scipy.stats.norm.sf(abs(z))*1 #one-sided

    return p_val, p_1, p_2, z

"""
Run a two independent sample t-test
https://libguides.library.kent.edu/SPSS/IndependentTTest
Takes in two lists of data and runs test
Currently using Welch's t-test, not Student's t-test, is this correct?
https://en.wikipedia.org/wiki/Welch%27s_t-test
NOTE: Not currently used, see equivalence test below
"""
def two_independent_sample_t_test(data_a, data_b):

    # Check if input data is valid
    if len(data_a) > 0 and len(data_b) > 0:

        mean_a, std_a = find_mean_and_std(data_a)
        mean_b, std_b = find_mean_and_std(data_b)

        print("Mean a: ", mean_a)
        print("Std a: ", std_a)
        print("Mean b: ", mean_b)
        print("Std b: ", std_b)

        import scipy.stats
        statistic, p_value = scipy.stats.ttest_ind(data_a, data_b, equal_var=False)

        tost_data = {
            'mean_a': mean_a,
            'std_a': std_a,
            'mean_b': mean_b,
            'std_b': std_b,
            'delta': 0,
            'p_val': p_value,
            'error': False
        }
    else:
        tost_data = {
            'mean_a': 0,
            'std_a': 0,
            'mean_b': 0,
            'std_b': 0,
            'delta': 0,
            'p_val': 0,
            'error': True
        }

    # Return data
    return tost_data


"""
Known as the TOST test
Equivalence testing:
code:
http://jpktd.blogspot.com/2012/10/tost-statistically-significant.html
calculating deltas:
http://tsjuzek.com/blog/the_tost.html

"""
def two_sample_equivalence_test(data_a, data_b):

    # Check if input data is valid
    if len(data_a) > 0 and len(data_b) > 0:

        # Query config to check delta calculation methods
        use_formula = read_id_from_config("FaultSight", "useDeltaFormulaForTost")

        if use_formula:
            delta = calculate_delta_by_formula(data_a, data_b)
        else:
            delta = calculate_delta_by_value(data_a, data_b)

        # usevar : string, 'pooled' or 'unequal'
        # If 'pooled', then the standard deviation of the samples is assumed to be the same.
        # If 'unequal', then Welsh ttest with Satterthwait degrees of freedom is used
        usevar = 'unequal'

        # Run TOST test
        import statsmodels.stats.weightstats as ssws
        p_value = ssws.ttost_ind(data_a, data_b, -1 * delta, delta, usevar=usevar)[0]

        mean_a, std_a = find_mean_and_std(data_a)
        mean_b, std_b = find_mean_and_std(data_b)
        print("Mean a: ", mean_a)
        print("Std a: ", std_a)
        print("Mean b: ", mean_b)
        print("Std b: ", std_b)
        print("Delta: ", delta)
        print("TOST P-val: ", p_value)

        tost_data = {
            'mean_a': mean_a,
            'std_a': std_a,
            'mean_b': mean_b,
            'std_b': std_b,
            'delta': delta,
            'p_val': p_value,
            'error': False
        }
    else:
        tost_data = {
            'mean_a': 0,
            'std_a': 0,
            'mean_b': 0,
            'std_b': 0,
            'delta': 0,
            'p_val': 0,
            'error': True
        }

    # Return data
    return tost_data

"""
Uses the following formula for calculating deltas:
http://tsjuzek.com/blog/the_tost.html
"""
def calculate_delta_by_formula(data_a, data_b):
    mean_a, std_a = find_mean_and_std(data_a)
    mean_b, std_b = find_mean_and_std(data_b)

    # Calculate delta
    # delta = 4.58 * (avg_std / sqrt_avg_num_entries)
    avg_std = (std_a + std_b) / 2
    avg_num_entries = ( len(data_a) + len(data_b) ) / 2
    import math
    sqrt_avg_num_entries = math.sqrt(avg_num_entries)
    delta = 4.58 * (avg_std / sqrt_avg_num_entries)
    return delta

"""
Uses the user-provided delta value
"""
def calculate_delta_by_value(data_a, data_b):
    # Query config file for value
    delta = read_id_from_config("FaultSight", "deltaValueForTost")
    return float(delta)

def find_mean_and_std(data):
    import scipy.stats
    import numpy
    return numpy.mean(data), numpy.std(data)

def test_of_proportions(num_total_injections, num_total_sites, num_type_injections, num_type_sites):

    if num_type_sites == 0 or num_total_injections == 0:
        return "Unable to determine", 0.0, 0.0, 0.0

    x_1 = num_type_injections * 1.0
    n_1 = num_total_injections * 1.0

    x_2 = num_type_sites * 1.0
    n_2 = num_total_sites * 1.0

    p_1 = x_1 / n_1
    p_2 = x_2 / n_2

    p_combined = (x_1 + x_2) / (n_1 + n_2)

    numerator = p_1 - p_2

    import numpy
    denominator = numpy.sqrt(p_combined * (1 - p_combined) * ( (1.0 / n_1) + (1.0 / n_2) ))

    z = numerator / denominator

    import scipy.stats
    p_val = scipy.stats.norm.sf(abs(z))*2 #two-sided

    return p_val, p_1, p_2, z


# Gets the number of trials (equal to number of rows in the trials table)
def get_num_trials():
    return db.session.query(trials).count()




def calculate_num_sites_for_function(function_name, site_type=""):

    query = db.session.query(sites)\
                        .filter(sites.func == function_name)

    if site_type != "":
        query = query.filter(sites.type == site_type)

    use_dynamic = read_id_from_config("FaultSight", "useDynamic")
    if use_dynamic == "True":
        use_dynamic = True
    else:
        use_dynamic = False

    if use_dynamic and query.count() != 0:
        return query.with_entities(sqlFunc.sum(sites.numExecutions)).scalar()
    else:
        return query.count()
