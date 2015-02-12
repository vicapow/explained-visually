import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

# Defra data.
X = np.array([
    ['Cheese'            ,  105,  103,  103,   66],
    ['Carcase meat'      ,  245,  227,  242,  267],
    ['Other meat'        ,  685,  803,  750,  586],
    ['Fish'              ,  147,  160,  122,   93],
    ['Fats and oils'     ,  193,  235,  184,  209],
    ['Sugars'            ,  156,  175,  147,  139],
    ['Fresh potatoes'    ,  720,  874,  566, 1033],
    ['Fresh Veg'         ,  253,  265,  171,  143],
    ['Other Veg'         ,  488,  570,  418,  355],
    ['Processed potatoes',  198,  203,  220,  187],
    ['Processed Veg'     ,  360,  365,  337,  334],
    ['Fresh fruit'       , 1102, 1137,  957,  674],
    ['Cereals'           , 1472, 1582, 1462, 1494],
    ['Beverages'         ,   57,   73,   53,   47],
    ['Soft drinks'       , 1374, 1256, 1572, 1506],
    ['Alcoholic drinks'  ,  375,  475,  458,  135],
    ['Confectionery'     ,   54,   64,   62,   41]
])[:,1:].astype(np.float).T

pca = PCA(n_components=2)

X1 = pca.fit_transform(X)

print X1

plt.plot(X1[:,0], X1[:,1], 'ro')
plt.show()

# print "PCA eigen vals:", pca.explained_variance_ratio_
# print "PCA eigen vec[0]:", pca.components_[0]
# print "PCA eigen vec[1]:", pca.components_[1]