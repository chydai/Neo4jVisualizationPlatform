# coding=utf-8
import json
from flask import Flask, jsonify, render_template, request
from neo4j import GraphDatabase
from flask_cors import CORS
# from gevent import pywsgi

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "neo"))

app = Flask(__name__)
CORS(app)

# 构建web显示节点
def buildNodes(nodeRecord):
    data = {"id": nodeRecord._id, "label": list(nodeRecord._labels)[0]}  # 将集合元素变为list，然后取出值
    data.update(dict(nodeRecord._properties))  #
    return {"data": data}


# 构建web显示边
def buildEdges(relationRecord):
    data = {"source": relationRecord.start_node._id,
            "target": relationRecord.end_node._id,
            "relationship": relationRecord.type}
    data.update(dict(relationRecord._properties))
    return {"data": data}


# 解析请求数据并以json形式返回
def request_parse(req_data):
    if req_data.method == 'POST':
        data = req_data.json
    elif req_data.method == 'GET':
        data = req_data.args
    return data


# 建立路由，指向网页
@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')


# 两个路由指向同一个网页，返回图的节点和边的结构
@app.route('/graph')
def get_graph():
    with driver.session() as session:
        results = session.run('MATCH (m)-[r]->(n) RETURN m,n,r').values()
        nodeList = []
        edgeList = []
        for result in results:
            nodeList.append(result[0])
            nodeList.append(result[1])
            nodeList = list(set(nodeList))
            edgeList.append(result[2])

        nodes = list(map(buildNodes, nodeList))
        # {'data': {'id': 1, 'label': 'blca', 'tsvn': '0', 'op': '0', 'msi': '1', 'ch': '0', 'gl': '0',
        # 'log': '-2.121177108', 'urd': '1', 'ms': '0', 'aj': '1', 'my': '0', 'emt': '0', 'dr': '1', 'et': '0',
        # 'mtv2': '0', 'core': '0', 'hy': '0', 'mtv1': '0', 'jgr': '0', 'uvu': '1', 'upr': '0', 'name': 'NPR\xa01.00',
        # 'iar': '0', 'gc': '0', 'sp': '0'}}

        edges = list(map(buildEdges, edgeList))
        # {'data': {'source': 347, 'target': 1, 'relationship': 'r', 'tsvn': '0', 'op': '0', 'msi': '0', 'gl': '0',
        # 'ch': '0', 'ms': '0', 'urd': '0', 'aj': '0', 'my': '0', 'emt': '0', 'dr': '0', 'et': '0', 'mtv2': '0',
        # 'mtv1': '0', 'hy': '0', 'jgr': '0', 'uvu': '0', 'upr': '1', 'w': '0.43912', 'iar': '0', 'gc': '1', 'sp': '0'}}

        # {'data': {'source': 279, 'target': 0, 'relationship': 'blca', 'w': '-0.11003', 'drug': '0'}}

        # kk = jsonify(elements={"nodes": nodes, "edges": edges})
        print('hello web')

        # {
        #   "elements":{
        #          "nodes":[  {"data":{}}, {"data":{}}, {"data":{}} ],
        #          "edges":[  {"data":{}}, {"data":{}}, {"data":{}} ]
        #    }
        # }
        #
        # alert(result.elements.nodes[0].data['name']);
        # alert(result.elements.edges[0].data['drug']);

    return jsonify(elements={"nodes": nodes, "edges": edges})


# gene
@app.route('/gene')
def get_gene():
    data = json.loads(request.args.get('data'))
    gene = data['gene']
    print(gene)
    with driver.session() as session:
        results = session.run('MATCH (m:' + gene + ')-[r]->(n:' + gene + ') RETURN m,n,r').values()
        nodeList = []
        edgeList = []
        for result in results:
            nodeList.append(result[0])
            nodeList.append(result[1])
            nodeList = list(set(nodeList))
            edgeList.append(result[2])
        nodes = list(map(buildNodes, nodeList))
        edges = list(map(buildEdges, edgeList))
    print(len(results))
    if len(results) == 0:
        return '0'
    return jsonify(elements={"nodes": nodes, "edges": edges})


# 坐标操作图片处理的按钮路由
@app.route('/subweb')
def get_subweb():
    data = json.loads(request.args.get('data'))
    startnote = data['startnote']
    endnote = data['endnote']
    gene = data['gene']
    print(startnote, endnote)
    with driver.session() as session:
        results = session.run('MATCH (m:' + gene + '{name:"' + startnote + '"}),(n:' + gene + '{name:"' + endnote
                              + '"}), p=shortestpath((m)-[r*..10]->(n)) RETURN p').values()
        # results2 = session.run('MATCH (m:' + gene + '{name:"' + startnote + '"}),(n:' + gene + '{name:"' + endnote
        #                       + '"}), p=shortestpath((m)-[r*..10]->(n)) RETURN m,n,r').values()
        nodeList = []
        edgeList = []

        # print(results[0][0].relationships)
        # print(results2[0][0])

        for node in results[0][0].nodes:
            nodeList.append(node)
        nodeList = list(set(nodeList))
        for edge in results[0][0].relationships:
            edgeList.append(edge)

        nodes = list(map(buildNodes, nodeList))
        edges = list(map(buildEdges, edgeList))
    print(len(results))
    if len(results) == 0:
        return '0'
    return jsonify(elements={"nodes": nodes, "edges": edges})


# keynode
###########################
@app.route('/keynode')
def get_keynode():
    data = json.loads(request.args.get('data'))
    gene = data['gene']
    with driver.session() as session:
        results = session.run('MATCH (m)-[r]->(n) RETURN m,n,r').values()
        nodeList = []
        edgeList = []
        for result in results:
            nodeList.append(result[0])
            nodeList.append(result[1])
            nodeList = list(set(nodeList))
            edgeList.append(result[2])
        nodes = list(map(buildNodes, nodeList))
        edges = list(map(buildEdges, edgeList))
    print(len(results))
    if len(results) == 0:
        return '0'
    return jsonify(elements={"nodes": nodes, "edges": edges})


# drug
@app.route('/drug')
def get_drug():
    data = json.loads(request.args.get('data'))
    gene = data['gene']
    with driver.session() as session:
        results = session.run('MATCH (m)-[r:' + gene + '{drug:"1"}]->(n) RETURN m,n,r').values()
        nodeList = []
        edgeList = []
        for result in results:
            nodeList.append(result[0])
            nodeList.append(result[1])
            nodeList = list(set(nodeList))
            edgeList.append(result[2])
        nodes = list(map(buildNodes, nodeList))
        edges = list(map(buildEdges, edgeList))
    print(len(results))
    if len(results) == 0:
        return '0'
    return jsonify(elements={"nodes": nodes, "edges": edges})


if __name__ == '__main__':
    app.run(debug=True)
