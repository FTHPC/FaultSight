import os
import sys
import random
import time

nTrials = int(sys.argv[1])
seed = int (sys.argv[2])
random.seed(seed)
start = 0
if len(sys.argv) >=4:
    start = int(sys.argv[3])
for i in range(0, start):
    t = random.randint(0,50000000)
    print "Skippig trial %d with seed %d" %(i, t)


i = start

while i < nTrials:

    outfile = open("fault" + str(i) + ".pbs", "w")
    outfile.write("#!/bin/bash\n"
                "#PBS -l select=2:ncpus=16:mem=7gb\n"
                "#PBS -l walltime=24:00:00\n"
                #"#PBS -q c1_tiny\n"
                "#PBS -j oe\n"
        "#PBS -A jr5\n"
                "#PBS -N Einar_test\n"
                "module load gcc/4.8.1\n"
                "module load mpich\n"
                "module list\n")
    j = 0
    while j < (nTrials-start)/8 + 1:
    	if i+j < nTrials:
        	outfile.write("\n"
        		"mkdir $PBS_O_WORKDIR/test_" + str(i+j) + "\n"
                	"cd $PBS_O_WORKDIR/test_" +str(i+j)+"\n"
                	"/home/calhou3/research/einar/strassen --stateFile /home/calhou3/research/FlipIt//.einar "
                	+ str(random.randint(0,50000000)) + " &> test_" +str(i+j) + ".txt\n")

	j += 1
    i += j

    outfile.close()
    print "Launching job", i
    #os.system("qsub fault" + str(i) + ".pbs")
    #if i+1 % 5 == 0:
#   time.sleep(15*60)
    

