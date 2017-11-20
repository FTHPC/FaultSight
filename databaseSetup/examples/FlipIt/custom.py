import numpy as np
from matplotlib import pyplot as plot
from analysis_config import *
from databaseSetup import *

std_dev_tot_lj = 0.58302507748
std_dev_pot_lj = 0.602672640918
std_dev_kin_lj = 0.0202961246537
avg_tot_lj = -0.583025077476
avg_pot_lj = -0.602650407279
avg_kin_lj = 0.0196253298024

max_allowed_pot_lj = 0
min_allowed_pot_lj = 0
min_allowed_kin_lj = 0
max_allowed_kin_lj = 0
min_allowed_tot_lj = 0
max_allowed_tot_lj = 0

std_dev_tot_eam = 0.00000245644141806
std_dev_pot_eam = 0.00797998180757
std_dev_kin_eam = 0.0079817573799
avg_tot_eam = -3.46053038527
avg_pot_eam = -3.49928531572
avg_kin_eam = 0.0387549304554

max_allowed_pot_eam = 0
min_allowed_pot_eam = 0
min_allowed_kin_eam = 0
max_allowed_kin_eam = 0
min_allowed_tot_eam = 0
max_allowed_tot_eam = 0



def customInit(c):
    # Calculate allowed bounds
    print("init")
    num_stds_lj = 3
    num_stds_eam = 10
    global min_allowed_pot_lj
    min_allowed_pot_lj = avg_pot_lj - num_stds_lj * std_dev_pot_lj
    global max_allowed_pot_lj
    max_allowed_pot_lj = avg_pot_lj + num_stds_lj * std_dev_pot_lj
    global min_allowed_kin_lj
    min_allowed_kin_lj = avg_kin_lj - num_stds_lj * std_dev_kin_lj
    global max_allowed_kin_lj
    max_allowed_kin_lj = avg_kin_lj + num_stds_lj * std_dev_pot_lj
    global min_allowed_tot_lj
    min_allowed_tot_lj = avg_tot_lj - num_stds_lj * std_dev_tot_lj
    global max_allowed_tot_lj
    max_allowed_tot_lj = avg_tot_lj + num_stds_lj * std_dev_tot_lj

    global min_allowed_pot_eam
    min_allowed_pot_eam = avg_pot_eam - num_stds_eam * std_dev_pot_eam
    global max_allowed_pot_eam
    max_allowed_pot_eam = avg_pot_eam + num_stds_eam * std_dev_pot_eam
    global min_allowed_kin_eam
    min_allowed_kin_eam = avg_kin_eam - num_stds_eam * std_dev_kin_eam
    global max_allowed_kin_eam
    max_allowed_kin_eam = avg_kin_eam + num_stds_eam * std_dev_pot_eam
    global min_allowed_tot_eam
    min_allowed_tot_eam = avg_tot_eam - num_stds_eam * std_dev_tot_eam
    global max_allowed_tot_eam
    max_allowed_tot_eam = avg_tot_eam + num_stds_eam * std_dev_tot_eam
    """
    User defined function to initialize the fault injection campaign
    database.

    Parameters
    ----------
    c : object
        sqlite3 database handle that is open to a valid filled database
    Notes
    ----------
    Users will  want to use this funcction to extend current tables or
    add there own tables to the data.

    Example
    -------
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='custom'")
    if len(c.fetchall()) == 0:
        c.execute("CREATE TABLE custom (trial int, site, iter int, rank int, level int, direction int)")
        c.execute("ALTER TABLE trials ADD COLUMN iter int")
        c.execute("ALTER TABLE trials ADD COLUMN converged int")
    """

def customParser(c, line, trial):
    """Parses the output of a fault injection trial for items interested to the user
    Parameters
    ----------
    c : object
        sqlite3 database handle that is open to a valid filled database

    line : str
        Single line from the output file of a fault injection trial
    trial: int
        number of fault injection trial. obtained from filename
    Notes
    ----------
    Users will want to fill out this function to parse both the custom
    injection log and any other lines such as detection messages or
    algorithm progress that may be visualized later.

    Example
    -------
    if numIterationMessage in l:
        iter = int(l.split(" ")[-1])
        c.execute("UPDATE  trials SET  iter = ? WHERE trials.trial = ?", (iter, trial))
    if notConvergedMsg in l:
        c.execute("UPDATE trials SET converged = ? WHERE trials.trial = ?", (0,trial))
    """
    hpccg_custom_parse(c, line, trial)

    def hpccg_custom_parse(c, line, trial):
        # update iteration count for the current trial, if relevant
        split_line = line.split(' ')
        if iteration_check(split_line):
            iterations = get_iterations(split_line)
            update_trial_num_iterations(c, iterations)

        if detection_check(split_line):
            row_arguments = {
                'detector': "Residual Check",
            }
            insert_detection(c, row_arguments)

    def detection_check(split):
        if split[0] == '[RESIDUAL' and split[1] == 'CHECK]':
            return True
        return False

    def get_iterations(split):
        return split[2]

    def iteration_check(split)
        if split[0] == 'Iteration' and split[5] == 'Residual':
            return True
        return False



    def comd_custom_parse(c, line, trial):
        # #  Loop   Time(fs)       Total Energy   Potential Energy     Kinetic Energy  Temperature   (us/atom)     # Atoms
        #  0       0.00    -3.460523233088    -3.538079224688     0.077555991600     600.0000     0.0000       128000
        # print("Line")
        # print(line)
        # if line.count(' ') != 44:
        #     print("Not 44")
        #     return



        space_split_line = line.split(' ')
        split_line = [x for x in space_split_line if len(x.strip()) != 0]
        if len(split_line) != 8:
            return

        try:
            loop = float(split_line[0])
            # time = float(split_line[1])
            total_energy = float(split_line[2])
            potential_energy = float(split_line[3])
            kinetic_energy = float(split_line[4])
            # temperature = float(split_line[5])
            # us_per_atom = float(split_line[6])
            # atoms = float(split_line[7])
        except:
            print("Likely invalid line")
            return

        # # We raise a detected flat if pot., kin., or total energy is outside of [ avg - 3*std, avg + 3*std]

        # eamForce
        if trial <= 1500:
            if total_energy < min_allowed_tot_eam or max_allowed_tot_eam < total_energy:
                row_arguments = {
                    'detector': "Total energy",
                }
                print("Trial: ", trial)
                print("Energy: ", total_energy)
                print("Min allowed: ", min_allowed_tot_eam)
                print("Max allowed: ", max_allowed_tot_eam)
                insert_detection(c, row_arguments)
        else:   # ljForce
            if total_energy < min_allowed_tot_lj or max_allowed_tot_lj < total_energy:
                row_arguments = {
                    'detector': "Total energy",
                }
                insert_detection(c, row_arguments)

        # # eamForce
        # if trial <= 1500:
        #     if kinetic_energy < min_allowed_kin_eam or max_allowed_kin_eam < kinetic_energy:
        #         row_arguments = {
        #             'detector': "Kinetic energy",
        #         }
        #         print("Trial: ", trial)
        #         print("Iteration: ", loop)
        #         print("Energy: ", kinetic_energy)
        #         print("Min allowed: ", min_allowed_kin_eam)
        #         print("Max allowed: ", max_allowed_kin_eam)
        #         insert_detection(c, row_arguments)
        # else:   # ljForce
        #     if total_energy < min_allowed_tot_lj or max_allowed_tot_lj < total_energy:
        #         row_arguments = {
        #             'detector': "Total energy",
        #         }
        #         insert_detection(c, row_arguments)
