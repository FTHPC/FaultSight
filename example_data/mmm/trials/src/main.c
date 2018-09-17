#include <stdio.h>
#include <signal.h>

#include "FlipIt/corrupt/corrupt.h"

void sigHandler(int sig)
{
    printf("Receiving Sig %d\n", sig);
    exit(sig);
}



int main(int argc, char** argv)
{
	int n = 512, numIncorrect = 0, seed = 533, i, j;
	double* a = (double*) malloc(n*n*sizeof(double));
	double* b = (double*) malloc(n*n*sizeof(double));
	double* c_reg = (double*) malloc(n*n*sizeof(double));
	double* c_tile = (double*) malloc(n*n*sizeof(double));
	double* c_strassen = (double*) malloc(n*n*sizeof(double));
	double* c_golden = (double*) malloc(n*n*sizeof(double));
    if (signal (SIGSEGV, sigHandler) == SIG_ERR)
        printf("Error setting segfault handler...\n");

	/* Initialize arrays */
	for (i=0; i<n; i++)
		for(j=0; j<n; j++)
		{
			a[i*n + j] = i*j;
			b[i*n + j] = i*j;
			c_reg[i*n + j] = 0;
			c_tile[i*n + j] = 0;
			c_strassen[i*n + j] = 0;
			c_golden[i*n + j] = 0;
		}
	/* Set up injector and compute golden solution not in MPI so 
	    pass 0 for the first argument(MPI rank)*/
    seed = strtol(argv[argc-1], NULL, 0);
	FLIPIT_Init(0, argc, argv, seed);
	FLIPIT_SetInjector(FLIPIT_OFF);
	matmul(a, b, c_golden, n);

	/* compute */
	printf("Starting faulty computation.\n");
	FLIPIT_SetInjector(FLIPIT_ON);
	matmul(a, b, c_reg, n);
    double* c = c_reg;
//	matmul_tiled(a, b, c_tile, n);
//    double* c = c_tile;
	//matmul_strassen(a, b, c_strassen, n);
    //double* c = c_strassen;

	/* check */
	for (i=0; i<n; i++)
		for (j=0; j<n; j++)
			if (c[i*n + j] != c_golden[i*n +j])
				numIncorrect += 1;

	printf("Number of incorrect elements: %d\n", numIncorrect);
	FLIPIT_Finalize(NULL);
    free(a);
    free(b);
    free(c_reg);
    free(c_tile);
    free(c_strassen);
    free(c_golden);
	return 0;
}
