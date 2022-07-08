import pandas as pd

sheet_names1 = ['blca', 'brca', 'coad', 'esca', 'kich', 'kirc', 'kirp', 'lihc', 'luad', 'lusc', 'paad', 'prad',
                'read', 'skcm', 'stad', 'thca', 'thym', 'ucec']
sheet_names2 = ['BLCA', 'BRCA', 'COAD', 'ESCA', 'KICH', 'KIRC', 'KIRP', 'LIHC', 'LUAD', 'LUSC', 'PAAD', 'PRAD',
                'READ', 'SKCM', 'STAD', 'THCA', 'THYM', 'UCEC']

core_numbers = [3, 9, 6, 8, 8, 9, 9, 9, 6, 9, 5, 8,
                4, 9, 8, 9, 5, 9]
hallmark_numbers = [21, 27, 33, 34, 25, 38, 26, 22, 30, 29, 42, 28,
                    31, 34, 36, 42, 32, 36]

writer = pd.ExcelWriter('./data/vertex/vertex.xlsx')

# len(sheet_names1)
for m in range(len(sheet_names1)):
    xlsx0 = pd.read_excel('./data/vertex/edge.xlsx', sheet_name=sheet_names1[m])
    xlsx1 = pd.read_excel('./data/vertex/table_s1_dge.xlsx', sheet_name=sheet_names2[m])
    xlsx2 = pd.read_excel('./data/vertex/table_s2_gsea.xlsx', sheet_name=sheet_names2[m])
    xlsx4 = pd.read_excel('./data/vertex/table_s4_gene_score.xlsx', sheet_name=sheet_names2[m])

    hallmark = xlsx2.loc[:, 'hallmark'].values
    # print(hallmark[0])

    result = pd.DataFrame(columns=['NAME', 'LOG', 'CORE'])

    xlsx0 = xlsx0.drop_duplicates(subset='FROM', keep='first')
    # print(xlsx0.loc[:, 'FROM'])

    for i in xlsx0.loc[:, 'FROM']:
        # print(i)

        # 计算log
        log_v = xlsx1.loc[xlsx1['gene'] == i, 'log2FoldChange'].values
        if len(log_v) != 1:
            log = 0
        else:
            log = log_v[0]
        # print(log)

        # 计算core
        core_v = xlsx4.loc[0:core_numbers[m], 'Name'].values
        if i in core_v:
            core = 1
        else:
            core = 0
        # print(core)

        df = pd.DataFrame([[i, log, core]], columns=['NAME', 'LOG', 'CORE'])

        # 计算hallmark
        for j in range(len(hallmark)):
            gene_set = xlsx2.loc[j, 'gene_set'].split('/')
            if i in gene_set:
                df.loc[:, hallmark[j]] = 1
            else:
                df.loc[:, hallmark[j]] = 0
        # print(len(hallmark))

        result = result.append(df, ignore_index=True)

    result.to_excel(writer, index=False, sheet_name=sheet_names1[m])

writer.save()
writer.close()
