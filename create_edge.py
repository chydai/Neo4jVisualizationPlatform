import pandas as pd

sheet_names = ['BLCA - 表格 1', 'BRCA - 表格 1', 'COAD - 表格 1', 'ESCA - 表格 1', 'KICH - 表格 1', 'KIRC - 表格 1',
               'KIRP - 表格 1', 'LIHC - 表格 1', 'LUAD - 表格 1', 'LUSC - 表格 1', 'PAAD - 表格 1', 'PRAD - 表格 1',
               'READ - 表格 1', 'SKCM - 表格 1', 'STAD - 表格 1', 'THCA - 表格 1', 'THYM - 表格 1', 'UCEC - 表格 1']
result_names = ['blca', 'brca', 'coad', 'esca', 'kich', 'kirc', 'kirp', 'lihc', 'luad', 'lusc', 'paad', 'prad',
                'read', 'skcm', 'stad', 'thca', 'thym', 'ucec']

writer = pd.ExcelWriter('./data/edge/edge.xlsx')

for m in range(len(sheet_names)):
    xlsx = pd.read_excel('./data/edge/table_s3_cancer_networks.xlsx', sheet_name=sheet_names[m])
    # 文件名以及路径，如果路径或者文件名有中文给前面加一个 r
    result = pd.DataFrame(columns=['FROM', 'TO', 'W', 'DRUG'])

    for i in range(len(xlsx)):
        # print(xlsx.loc[i])
        if xlsx.loc[i].loc['interact'] == 0:
            if xlsx.loc[i].loc['weight'] > 0:
                df = pd.DataFrame([
                    [xlsx.loc[i].loc['source_genesymbol'], xlsx.loc[i].loc['target_genesymbol'], abs(xlsx.loc[i].loc['weight']), 0]
                ], columns=['FROM', 'TO', 'W', 'DRUG'])
            else:
                df = pd.DataFrame([
                    [xlsx.loc[i].loc['target_genesymbol'], xlsx.loc[i].loc['source_genesymbol'], abs(xlsx.loc[i].loc['weight']), 0]
                ], columns=['FROM', 'TO', 'W', 'DRUG'])
        elif xlsx.loc[i].loc['interact'] == 1:
            if xlsx.loc[i].loc['weight'] > 0:
                df = pd.DataFrame([
                    [xlsx.loc[i].loc['source_genesymbol'], xlsx.loc[i].loc['target_genesymbol'], abs(xlsx.loc[i].loc['weight']), 0]
                ], columns=['FROM', 'TO', 'W', 'DRUG'])
            else:
                df = pd.DataFrame([
                    [xlsx.loc[i].loc['target_genesymbol'], xlsx.loc[i].loc['source_genesymbol'], abs(xlsx.loc[i].loc['weight']), 0]
                ], columns=['FROM', 'TO', 'W', 'DRUG'])
        elif xlsx.loc[i].loc['interact'] == -1:
            if xlsx.loc[i].loc['weight'] < 0:
                df = pd.DataFrame([
                    [xlsx.loc[i].loc['source_genesymbol'], xlsx.loc[i].loc['target_genesymbol'], abs(xlsx.loc[i].loc['weight']), 0]
                ], columns=['FROM', 'TO', 'W', 'DRUG'])
            else:
                df = pd.DataFrame([
                    [xlsx.loc[i].loc['target_genesymbol'], xlsx.loc[i].loc['source_genesymbol'], abs(xlsx.loc[i].loc['weight']), 0]
                ], columns=['FROM', 'TO', 'W', 'DRUG'])

        result = result.append(df, ignore_index=True)

    # print(result)
    result.to_excel(writer, index=False, sheet_name=result_names[m])

writer.save()
writer.close()
