from faultSight import app
from faultSight.database import db, relevant_tables, trials
from faultSight.constants import *

from sqlalchemy.engine import reflection

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
    return config.get(section, id)



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

    p_1 = n_1 / d_2
    p_2 = n_2 / d_2

    p_combined = (n_1 + n_2) / (d_1 + d_2)

    numerator = p_1 - p_2

    import numpy
    denominator = numpy.sqrt(p_combined * (1 - p_combined) * ( (1.0 / d_1) + (1.0 / d_2) ))

    if denominator == 0:
        return "Unable to determine", 0.0, 0.0, 0.0

    z = numerator / denominator

    import scipy.stats
    p_val = scipy.stats.norm.sf(abs(z))*1 #one-sided

    return p_val, p_1, p_2, z



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


