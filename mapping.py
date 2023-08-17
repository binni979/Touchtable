import os
import yaml
import json

def extract_info_from_mdx(mdx_content):
    colormap_name = None
    rescale = None
    stacCol = None
    nodata = None

    for document in yaml.safe_load_all(mdx_content):
        layers_data = document.get('layers', [])
        if layers_data:
            source_params = layers_data[0].get('sourceParams', {})
            legend = layers_data[0].get('legend', {})
            colormap_name = source_params.get('colormap_name', None)
            rescale = source_params.get('rescale', None)
            nodata = source_params.get('nodata', None)
            stacCol = layers_data[0].get('stacCol', None)
            type = legend.get('type', None)
            stops = legend.get('stops', None)
            break

    return colormap_name, rescale, nodata, type, stops, stacCol

def process_mdx_file(file_path):
    with open(file_path, 'r') as f:
        mdx_content = f.read()
    return extract_info_from_mdx(mdx_content)

mdx_files_directory = 'datasets/.'
mdx_files = [f for f in os.listdir(mdx_files_directory) if f.endswith('.mdx')]

result = {}
for file in mdx_files:
    file_name = os.path.splitext(file)[0]
    file_path = os.path.join(mdx_files_directory, file)
    colormap_name, rescale, nodata,type, stops, stacCol = process_mdx_file(file_path)
    result[stacCol] = {"colormap": colormap_name, "rescale": rescale, "nodata": nodata, "type": type, "stops": stops}

output_file = 'output.json'
with open(output_file, 'w') as json_file:
    json.dump(result, json_file, indent=2)

print(f"Data saved to {output_file}")
