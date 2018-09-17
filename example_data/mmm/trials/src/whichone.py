import numpy as np

x = np.zeros(6000)
for l in open("out.txt").readlines():
    split = l[:-2].split(" ")[-1]
    idx = int(split.split("_")[-1])
    x[idx] = 1


for i in xrange(x.shape[0]):
    if x[i] == 0:
        print i
