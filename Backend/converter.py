import sys
import json
import copy
import re

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
        if re.match(numbers, char):
            value = ''
            while re.match(numbers, char):
                value += char
                current += 1
                if current < len(input_expression):
                    char = input_expression[current]
                else:
                    break
            tokens.append({'type': 'number', 'value': value})
            continue
        if re.match(alphabet, char):
            value = ''
            while re.match(alphabet, char):
                value += char
                current += 1
                if current < len(input_expression):
                    char = input_expression[current]
                else:
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
        output = compiler(input_expr)
        print(json.dumps({"output": output}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":  # This line is now correctly indented
    main()