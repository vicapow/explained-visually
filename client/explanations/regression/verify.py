import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

X = np.array([
  [16,  5, 0],
  [13, 23, 0],
  [24, 33, 0],
  [43, 32, 0],
  [51, 53, 0],
  [84, 65, 0],
  [90, 85, 0]
])

y = X[:,1]
X = np.array([np.ones(len(X)), X[:,0], np.random.sample(len(X)) / 10 ]).T

print np.dot(np.dot(np.linalg.inv(np.dot(X.T, X)), X.T), y)
