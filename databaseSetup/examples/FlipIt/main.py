from database import init, finalize
from custom import customInit, customParser
from analysis_config import *

if __name__ == "__main__":
    c = init(database, LLVM_log_path, trial_path +"/"+ trial_prefix,\
        customFuncs=(customInit, customParser))
    finalize()
