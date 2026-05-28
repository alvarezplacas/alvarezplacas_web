f = 'src/pages/api/vendedor/views/buscador.ts'
lines = open(f, 'r', encoding='utf-8').readlines()

new_lines = []
i = 0
replaced = False
while i < len(lines):
    if not replaced and 'function highlight(text, term)' in lines[i]:
        # Replace old highlight function (5 lines) with simple indexOf-based one
        new_lines.append('    function highlight(text, term) {\n')
        new_lines.append('      if (!term || !text) return text || "";\n')
        new_lines.append('      var lo = text.toLowerCase(), lt = term.toLowerCase(), out = "", idx = 0;\n')
        new_lines.append('      while (idx < text.length) {\n')
        new_lines.append('        var p = lo.indexOf(lt, idx);\n')
        new_lines.append('        if (p < 0) { out += text.slice(idx); break; }\n')
        new_lines.append('        out += text.slice(idx, p) + "<span class=\\"hl\\">" + text.slice(p, p + term.length) + "</span>";\n')
        new_lines.append('        idx = p + term.length;\n')
        new_lines.append('      }\n')
        new_lines.append('      return out;\n')
        new_lines.append('    }\n')
        replaced = True
        # Skip next 4 lines (the old function body: if, const escaped, return, closing })
        i += 1
        count = 0
        while count < 4 and i < len(lines):
            i += 1
            count += 1
    else:
        new_lines.append(lines[i])
        i += 1

open(f, 'w', encoding='utf-8').writelines(new_lines)
print('Done. Replaced:', replaced, 'Total lines:', len(new_lines))
