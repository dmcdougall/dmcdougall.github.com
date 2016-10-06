---
layout: post
title: Parallel Monte Carlo using python and NumPy
date: 2014-04-25 20:29:45.000000000 -05:00
---
I occassionally read [Darren Wilkinson's blog](http://darrenjw.wordpress.com/), and you should too.  He talks about some pretty interesting stuff in the scientific and statistical computing fields.

I've taken a keen interest in some of the parallel implementations of Monte Carlo algorithms he's written about, most recently he wrote an implementation using Scala.  You can check out the post [here](http://darrenjw.wordpress.com/2014/02/23/parallel-monte-carlo-using-scala/).

I decided to try my hand at writing an implementation of Darren's  toy problem using python and NumPy.  It also gave me the opportunity to do some parallel programming in python since most of the parallel programming I do is either in C or C++ using MPI.  For a reminder of his toy problem, see the post linked above.

I'll cut straight to the chase and just post the code.  I've commented it so it should be fairly easy to read.

```
import sys
import numpy as np
from multiprocessing import Pool

def integrate(its):
    # I totally cheated and tweaked the number of chunks
    # to get the fastest result
    chunks = 10000
    chunk_size = its / chunks

    np.random.seed()  # Each process needs a different seed!

    sum = 0.0
    for i in xrange(chunks):  # For each chunk...
        # ...do a vectorised Monte Carlo calculation
        u = np.random.uniform(size=its/chunks)
        sum += np.sum(np.exp(-u * u))  # Do the Monte Carlo

	# We did 'its' total iterations in this process, so
    # normalise the result and return it
    return sum / float(its)

if __name__ == '__main__':
    num_procs = int(sys.argv[1])

    iters = 1000000000
    its = iters / num_procs  # Each process gets a share of the iterations

    pool = Pool(processes=num_procs)
    
    # Each process calls 'integrate' with 'its' iterations
    result = pool.map(integrate, [its] * num_procs)
    
    # pool.map returns a list of length 'num_procs', with
    # element 'i' being the return value of 'integrate' from
    # process 'i'

    # Renormalise by the number of processors
    print sum(result) / float(num_procs)
```

And here are the timings.  I just used the linux `time` command, so take these with a pinch of salt.

```
num_procs  time
1          0m23.578s
2          0m12.111s
3          0m8.490s
4          0m7.898s
5          0m7.492s
6          0m6.989s
7          0m6.497s
8          0m6.353s
9          0m6.402s
10         0m6.459s
11         0m6.460s
12         0m6.525s

16         0m6.680s
32         0m7.333s
64         0m8.692s
```

Can you guess how many cores my laptop has?

Comparing with the [Scala code](http://darrenjw.wordpress.com/2014/02/23/parallel-monte-carlo-using-scala/) yields some interesting things.  The python + NumPy code above will run anywhere from two (`num_proc = 8`) to four times (`num_proc = 1`) faster than the Scala code.  However, note that I did spend some time tweaking the chunksize.  The use of vectorising some of the Monte Carlo calculations in NumPy also helps a lot.

**Note:** If you plan on running this, be careful passing in a number of processes that doesn't divide the number of iterations, since all of those divisions are integer divisions in python 2.x.
