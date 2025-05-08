import sys
import json
import copy
import re
import matplotlib.pyplot as plt
import networkx as nx
import os
from matplotlib.colors import LinearSegmentedColormap

def tokenizer(input_expression):
    current = 0
    tokens = []
    alphabet = re.compile(r"[a-z]", re.I)
    numbers = re.compile(r"[0-9]")
    whiteSpace = re.compile(r"\s")

    while current < len(input_expression):
        char = input_expression[current]
        if re.match(whiteSpace, char):
            current += 1
            continue
        if char == '(':
            tokens.append({'type': 'left_paren', 'value': '('})
            current += 1
            continue
        if char == ')':
            tokens.append({'type': 'right_paren', 'value': ')'})
            current += 1
            continue
        if char in ['+', '-', '*', '/', '%']:  # Added support for mathematical operators
            tokens.append({'type': 'name', 'value': char})
            current += 1
            continue
        if re.match(numbers, char):
            value = ''
            while current < len(input_expression) and (re.match(numbers, input_expression[current]) or input_expression[current] == '.'):
                value += input_expression[current]
                current += 1
                if current >= len(input_expression):
                    break
            tokens.append({'type': 'number', 'value': value})
            continue
        if re.match(alphabet, char):
            value = ''
            while current < len(input_expression) and re.match(alphabet, input_expression[current]):
                value += input_expression[current]
                current += 1
                if current >= len(input_expression):
                    break
            tokens.append({'type': 'name', 'value': value})
            continue
        raise ValueError('Invalid character: ' + char)
    return tokens

def parser(tokens):
    global current
    current = 0

    def walk():
        global current
        token = tokens[current]
        if token['type'] == 'number':
            current += 1
            return {'type': 'NumberLiteral', 'value': token['value']}
        if token['type'] == 'left_paren':
            current += 1
            token = tokens[current]
            node = {
                'type': 'CallExpression',
                'name': token['value'],
                'params': []
            }
            current += 1
            token = tokens[current]
            while token['type'] != 'right_paren':
                node['params'].append(walk())
                token = tokens[current]
            current += 1
            return node
        raise TypeError(token['type'])

    ast = {'type': 'Program', 'body': []}
    while current < len(tokens):
        ast['body'].append(walk())
    return ast

def traverser(ast, visitor):
    def traverseArray(array, parent):
        for child in array:
            traverseNode(child, parent)

    def traverseNode(node, parent):
        method = visitor.get(node['type'])
        if method:
            method(node, parent)
        if node['type'] == 'Program':
            traverseArray(node['body'], node)
        elif node['type'] == 'CallExpression':
            traverseArray(node['params'], node)
        elif node['type'] == 'NumberLiteral':
            pass
        else:
            raise TypeError(node['type'])

    traverseNode(ast, None)

def transformer(ast):
    newAst = {'type': 'Program', 'body': []}
    ast = copy.deepcopy(ast)
    ast['_context'] = newAst['body']

    def CallExpressionTraverse(node, parent):
        expression = {
            'type': 'CallExpression',
            'callee': {
                'type': 'Identifier',
                'name': node['name']
            },
            'arguments': []
        }
        node['_context'] = expression['arguments']
        if parent['type'] != 'CallExpression':
            expression = {
                'type': 'ExpressionStatement',
                'expression': expression
            }
        parent['_context'].append(expression)

    def NumberLiteralTraverse(node, parent):
        parent['_context'].append({
            'type': 'NumberLiteral',
            'value': node['value']
        })

    traverser(ast, {
        'NumberLiteral': NumberLiteralTraverse,
        'CallExpression': CallExpressionTraverse
    })

    return newAst

def codeGenerator(node):
    if node['type'] == 'Program':
        return '\n'.join([codeGenerator(n) for n in node['body']])
    elif node['type'] == 'Identifier':
        return node['name']
    elif node['type'] == 'NumberLiteral':
        return node['value']
    elif node['type'] == 'ExpressionStatement':
        return f"{codeGenerator(node['expression'])};"
    elif node['type'] == 'CallExpression':
        callee = codeGenerator(node['callee'])
        args = ', '.join([codeGenerator(arg) for arg in node['arguments']])
        return f"{callee}({args})"
    else:
        raise TypeError(node['type'])

def visualize_ast(ast, title="Abstract Syntax Tree"):
    """Visualize the AST using networkx and matplotlib"""
    plt.figure(figsize=(12, 8))
    G = nx.DiGraph()
    
    # Custom node colors based on node type
    node_colors = {
        'Program': '#3498db',       # Blue
        'CallExpression': '#e74c3c', # Red
        'NumberLiteral': '#2ecc71', # Green
        'ExpressionStatement': '#f39c12', # Orange
        'Identifier': '#9b59b6'     # Purple
    }
    
    # Create a unique identifier for each node
    node_count = 0
    node_ids = {}
    node_labels = {}
    node_color_map = []
    
    def add_node_to_graph(node, parent_id=None):
        nonlocal node_count
        
        # Create a unique ID for this node
        node_id = f"node_{node_count}"
        node_count += 1
        
        # Create readable label based on node type and content
        if node['type'] == 'Program':
            label = 'Program'
        elif node['type'] == 'NumberLiteral':
            label = f"Number: {node['value']}"
        elif node['type'] == 'CallExpression':
            if 'callee' in node:
                label = f"Call: {node['callee']['name']}"
            else:
                label = f"Call: {node['name']}"
        elif node['type'] == 'ExpressionStatement':
            label = 'Expr'
        elif node['type'] == 'Identifier':
            label = f"ID: {node['name']}"
        else:
            label = node['type']
        
        # Add node to graph
        G.add_node(node_id)
        node_labels[node_id] = label
        node_color_map.append(node_colors.get(node['type'], '#95a5a6'))  # Default gray
        
        # Connect to parent if exists
        if parent_id:
            G.add_edge(parent_id, node_id)
        
        # Return the node's ID for children to connect to
        return node_id
    
    def traverse_ast(node, parent_id=None):
        node_id = add_node_to_graph(node, parent_id)
        
        # Recursively process children
        if node['type'] == 'Program':
            for child in node['body']:
                traverse_ast(child, node_id)
        elif node['type'] == 'CallExpression':
            # Handle callee if present (transformed AST)
            if 'callee' in node:
                traverse_ast(node['callee'], node_id)
                for arg in node['arguments']:
                    traverse_ast(arg, node_id)
            # Handle params if present (original AST)
            elif 'params' in node:
                for param in node['params']:
                    traverse_ast(param, node_id)
        elif node['type'] == 'ExpressionStatement':
            traverse_ast(node['expression'], node_id)
    
    # Start traversal from root
    traverse_ast(ast)
    
    # Create the layout
    pos = nx.spring_layout(G, seed=42, k=0.9)
    
    # Draw the graph
    nx.draw(G, pos, with_labels=False, node_color=node_color_map, 
            node_size=1500, arrows=True, arrowsize=20, width=2)
    
    # Add labels with offset
    nx.draw_networkx_labels(G, pos, labels=node_labels, font_size=10, 
                           font_color='black', font_weight='bold')
    
    # Add a legend
    legend_elements = [plt.Line2D([0], [0], marker='o', color='w', 
                                 label=f"{node_type}", markerfacecolor=color, markersize=10)
                      for node_type, color in node_colors.items()]
    plt.legend(handles=legend_elements, loc='upper left', title="Node Types")
    
    plt.title(title)
    plt.axis('off')
    
    # Save the visualization to a file
    output_path = "ast_visualization.png"
    plt.savefig(output_path, bbox_inches='tight', dpi=300)
    plt.close()
    
    return output_path

def visualize_tokens(tokens):
    """Visualize the tokens as a colorful table"""
    plt.figure(figsize=(10, len(tokens) * 0.4 + 1))
    
    # Set up the color mapping
    token_colors = {
        'left_paren': '#3498db',    # Blue
        'right_paren': '#2980b9',   # Dark Blue
        'name': '#e74c3c',          # Red
        'number': '#2ecc71'         # Green
    }
    
    # Create table data
    table_data = []
    for i, token in enumerate(tokens):
        table_data.append([i, token['type'], token['value']])
    
    # Create table
    table = plt.table(
        cellText=table_data,
        colLabels=['Index', 'Type', 'Value'],
        loc='center',
        cellLoc='center',
        cellColours=[['#f8f9fa', 
                     token_colors.get(token['type'], '#95a5a6'),
                     '#f8f9fa'] for token in tokens]
    )
    
    # Style the table
    table.auto_set_font_size(False)
    table.set_fontsize(12)
    table.scale(1, 1.5)
    plt.axis('off')
    plt.title('Tokenization Results')
    
    # Save to file
    output_path = "token_visualization.png"
    plt.savefig(output_path, bbox_inches='tight', dpi=300)
    plt.close()
    
    return output_path

def visualize_compilation_pipeline(input_expression):
    """Generate visualizations for each step of the compilation process"""
    results = {}
    
    # Step 1: Tokenization
    tokens = tokenizer(input_expression)
    results['tokens'] = tokens
    results['token_visualization'] = visualize_tokens(tokens)
    
    # Step 2: Parsing (Original AST)
    original_ast = parser(tokens)
    results['original_ast'] = original_ast
    results['original_ast_visualization'] = visualize_ast(original_ast, "Original AST")
    
    # Step 3: Transformation (Transformed AST)
    transformed_ast = transformer(original_ast)
    results['transformed_ast'] = transformed_ast
    results['transformed_ast_visualization'] = visualize_ast(transformed_ast, "Transformed AST")
    
    # Step 4: Code Generation
    output_code = codeGenerator(transformed_ast)
    results['output_code'] = output_code
    
    return results

def compiler(input_expression):
    tokens = tokenizer(input_expression)
    ast = parser(tokens)
    newAst = transformer(ast)
    output = codeGenerator(newAst)
    return output

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input expression provided"}))
        return
    
    input_expr = sys.argv[1]
    try:
        # Check if visualization is requested
        visualize = len(sys.argv) > 2 and sys.argv[2] == "--visualize"
        
        if visualize:
            # Generate visualizations
            results = visualize_compilation_pipeline(input_expr)
            print(json.dumps({
                "output": results['output_code'],
                "token_visualization": results['token_visualization'],
                "original_ast_visualization": results['original_ast_visualization'],
                "transformed_ast_visualization": results['transformed_ast_visualization']
            }))
        else:
            # Just compile
            output = compiler(input_expr)
            print(json.dumps({"output": output}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()