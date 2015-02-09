import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

# X = np.array([
#   [  -2.500000000000001,   -1.873333333333334],
#   [  0.2333333333333325, 0.026666666666666394],
#   [  0.8666666666666663,   0.8266666666666662],
#   [ -1.7000000000000006,  -1.1733333333333338],
#   [  3.1000000000000005,   2.1933333333333334]
# ])

# X = np.array([ [0, 0], [1, 1], [2, 2], [3, 3] ])

X = np.array([ [0, 1], [1, 1], [2, 1], [3, 0.5] ])

# normalize by mean.
X = np.subtract(X, np.mean(X, axis=0))

cov_mat = np.cov(X.T)
print "cov mat:", cov_mat
svd_val, svd_vec = np.linalg.eig(cov_mat)

print "SVD eigen vals:", svd_val
print "SVD eigen vec[0]:", svd_vec[:,0]
print "SVD eigen vec[1]:", svd_vec[:,1]

svd_vec = np.array([ svd_vec[:,0], svd_vec[:,1] ])


pca = PCA(n_components=2)
pca.fit(X)

# print "explained variance "
# print pca.explained_variance_ratio_

# PCA eigen vectors
pca_vec = pca.components_

print "PCA eigen vals:", pca.explained_variance_ratio_
print "PCA eigen vec[0]:", pca_vec[0]
print "PCA eigen vec[1]:", pca_vec[1]


def plot(eig_vec):
  plt.plot(X[:,0], X[:,1], 'ro')
  plt.plot([0], [0], 'bo')

  plt.quiver(eig_vec[0, 0], eig_vec[0, 1], angles='xy', scale_units='xy', scale=1, color='blue')
  plt.quiver(eig_vec[1, 0], eig_vec[1, 1], angles='xy', scale_units='xy', scale=1, color='green')

  plt.xlim([-4,4])
  plt.ylim([-4,4])

  plt.aspect = 'equal'

fig = plt.figure(1)
plot(svd_vec)
fig = plt.figure(2)
plot(pca_vec)
plt.show()

