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

# # normalize by mean.
# X = np.subtract(X, np.mean(X, axis=0))

# cov_mat = np.cov(X.T)
# print "cov mat:", cov_mat
# svd_val, svd_vec = np.linalg.eig(cov_mat)

# print "SVD eigen vals:", svd_val
# print "SVD eigen vec[0]:", svd_vec[:,0]
# print "SVD eigen vec[1]:", svd_vec[:,1]

# svd_vec = np.array([ svd_vec[:,0], svd_vec[:,1] ])


# pca = PCA(n_components=2)
# pca.fit(X)

# # print "explained variance "
# # print pca.explained_variance_ratio_

# # PCA eigen vectors
# pca_vec = pca.components_

# print "PCA eigen vals:", pca.explained_variance_ratio_
# print "PCA eigen vec[0]:", pca_vec[0]
# print "PCA eigen vec[1]:", pca_vec[1]


# def plot(eig_vec):
#   plt.plot(X[:,0], X[:,1], 'ro')
#   plt.plot([0], [0], 'bo')

#   plt.quiver(eig_vec[0, 0], eig_vec[0, 1], angles='xy', scale_units='xy', scale=1, color='blue')
#   plt.quiver(eig_vec[1, 0], eig_vec[1, 1], angles='xy', scale_units='xy', scale=1, color='green')

#   plt.xlim([-4,4])
#   plt.ylim([-4,4])

#   plt.aspect = 'equal'

# fig = plt.figure(1)
# plot(svd_vec)
# fig = plt.figure(2)
# plot(pca_vec)
# plt.show()

