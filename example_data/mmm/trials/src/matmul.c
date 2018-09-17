#define BLOCKSIZE 64
#include <stdlib.h>
#include <stdio.h>

void matmul(double* a, double* b, double* c, int n)
{
	int i, j, k;
	double tmp;

    for (i=0; i<n; i++)
		for(j=0; j<n; j++)
		{	
            tmp = 0.0;
			for(k=0; k<n; k++)
				tmp += a[i*n + k] * b[k*n + j];
			c[i*n + j] = tmp;
		}
}

int min(int a, int b){
    return a < b ? a : b;
}
void matmul_tiled(double* a, double* b, double* c, int n)
{
	int i, j, k, ii, jj, kk;
	double tmp;
    

    for (i=0; i<n; i+=BLOCKSIZE)
	{
        //for(k=0; k<n; k++)
        //    c[i*n + k] = 0;
        for(j=0; j<n; j+=BLOCKSIZE)
		{	
            for(ii=i; ii < min(n, i + BLOCKSIZE); ii++)
            {
                for(jj=j; jj < min(n, j+BLOCKSIZE); jj++)
                {
                    tmp = 0.0;
                    for(k=0; k<n; k++)
                        tmp += a[ii*n + k] * b[k*n + jj];
                    c[ii*n + jj] = tmp;
                }

            }
		}
    }
}

void matadd(double* a, double* b, double* c, int n)
{
	int i, j;

    for (i=0; i<n; i++)
		for(j=0; j<n; j++)
		{	
		    c[i*n + j] = a[i*n + j] + b[i*n + j];
		}

}
void print(double* a, int n)
{
    int i,j;
    printf("\n============------------==========\n");
    for (i=0; i < n; i++)
    {
        for (j=0; j<n; j++)
        {
            int tmp = a[i*n + j];
            printf("%d ", tmp);
        }
        printf("\n");
    }
}
void matsub(double* a, double* b, double* c, int n)
{
	int i, j;

    for (i=0; i<n; i++)
		for(j=0; j<n; j++)
		{	
		    c[i*n + j] = a[i*n + j] - b[i*n + j];
		}

}
void matmul_strassen(double* a, double* b, double* c, int n)
{
    double* tmp1 = (double*) malloc((n*n/4)*sizeof(double));
    double* tmp2 = (double*) malloc((n*n/4)*sizeof(double));
    
    double* a11 = (double*) malloc((n*n/4)*sizeof(double));
    double* a12 = (double*) malloc((n*n/4)*sizeof(double));
    double* a21 = (double*) malloc((n*n/4)*sizeof(double));
    double* a22 = (double*) malloc((n*n/4)*sizeof(double));
    
    double* b11 = (double*) malloc((n*n/4)*sizeof(double));
    double* b12 = (double*) malloc((n*n/4)*sizeof(double));
    double* b21 = (double*) malloc((n*n/4)*sizeof(double));
    double* b22 = (double*) malloc((n*n/4)*sizeof(double));
    
    double* c11 = (double*) malloc((n*n/4)*sizeof(double));
    double* c12 = (double*) malloc((n*n/4)*sizeof(double));
    double* c21 = (double*) malloc((n*n/4)*sizeof(double));
    double* c22 = (double*) malloc((n*n/4)*sizeof(double));
    

    double* m1 = (double*) malloc((n*n/4)*sizeof(double));
    double* m2 = (double*) malloc((n*n/4)*sizeof(double));
    double* m3 = (double*) malloc((n*n/4)*sizeof(double));
    double* m4 = (double*) malloc((n*n/4)*sizeof(double));
    double* m5 = (double*) malloc((n*n/4)*sizeof(double));
    double* m6 = (double*) malloc((n*n/4)*sizeof(double));
    double* m7 = (double*) malloc((n*n/4)*sizeof(double));
	int i, j, k, ii, jj, kk, N;
	double tmp;
    

    // partition A and B
    N = n/2;
    for (i=0; i< N; i++) 
    {

        for (j=0; j< N; j++) 
        {
            a11[i*N +j ] = a[i*n+j];
            b11[i*N +j ] = b[i*n+j];
            
            a12[i*N +j ] = a[i*n+j+N];
            b12[i*N +j ] = b[i*n+j+N];
            
            a21[i*N +j ] = a[(i+N)*n+j];
            b21[i*N +j ] = b[(i+N)*n+j];

            a22[i*N +j ] = a[(i+N)*n+j+N];
            b22[i*N +j ] = b[(i+N)*n+j+N];
        }
    }
    //print(a, n);
    //print(a11, N);
    //print(a12, N);
    //print(a21, N);
    //print(a22, N);
    
    //form m1 = (a11 + a22)(b11 + b22)
    matadd(a11, a22, tmp1, N);
    matadd(b11, b22, tmp2, N);
    matmul(tmp1, tmp2, m1, N);
    
    //form m2 = (a21 + a22)b11
    matadd(a21, a22, tmp1, N);
    matmul(tmp1, b11, m2, N);

    //form m3 = a11(b12 - b22)
    matsub(b12, b22, tmp1, N);
    matmul(a11, tmp1, m3, N);

    //form m4 = a22(b21 - b11)
    matsub(b21, b11, tmp1, N);
    matmul(a22, tmp1, m4, N);
    
    //form m5 = (a11 +a12)b22
    matadd(a11, a12, tmp1, N);
    matmul(tmp1, b22, m5, N);
    
    //form m6 = (a21 -a11)(b11 + b12)
    matsub(a21, a11, tmp1, N);
    matadd(b11, b12, tmp2, N);
    matmul(tmp1, tmp2, m6, N);

    //form m7 = (a12 -a22)(b21 + b22)
    matsub(a12, a22, tmp1, N);
    matadd(b21, b22, tmp2, N);
    matmul(tmp1, tmp2, m7, N);    



    //============================
    //form c11 = m1 + m4 - m5 + m7
    matadd(m1, m4, tmp1, N);
    matsub(tmp1, m5, tmp2, N);
    matadd(tmp2, m7, c11, N);

    //form c12 = m3 + m5
    matadd(m3, m5, c12, N);

    //form c21 = m2 + m4
    matadd(m2, m4, c21, N);

    //fomr c22 = m1 - m2 + m3 + m6
    matsub(m1, m2, tmp1, N);
    matadd(tmp1, m3, tmp2, N);
    matadd(tmp2, m6, c22, N);

    for (i=0; i< N; i++) 
    {

        for (j=0; j< N; j++) 
        {
            c[i*n+j] = c11[i*N +j ];
            c[i*n+j+N] = c12[i*N +j ];
            c[(i+N)*n+j] = c21[i*N +j ];
            c[(i+N)*n+j+N] = c22[i*N +j ]; 
        }
    }
    free(tmp1);
    free(tmp2);

    free(a11);
    free(a12);
    free(a21);
    free(a22);
    
    free(b11);
    free(b12);
    free(b21);
    free(b22);

    free(c11);
    free(c12);
    free(c21);
    free(c22);

    free(m1);
    free(m2);
    free(m3);
    free(m4);
    free(m5);
    free(m6);
    free(m7);


}
