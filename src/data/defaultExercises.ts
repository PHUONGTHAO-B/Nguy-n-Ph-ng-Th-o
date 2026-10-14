import { Exercise } from '../types';

export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'ex-1',
    code: 'TH1001',
    title: 'Tìm giá trị lớn nhất trong ba số',
    grade: '10',
    topic: 'Câu lệnh if-else',
    difficulty: 'Dễ',
    description: 'Viết chương trình nhập vào ba số nguyên a, b, c từ bàn phím (mỗi số trên một dòng hoặc cách nhau bởi dấu cách). Hãy tìm và in ra giá trị lớn nhất trong ba số đó.',
    inputFormat: 'Gồm 3 số nguyên a, b, c (có thể nhập trên 1 dòng cách nhau bởi dấu cách hoặc trên 3 dòng riêng biệt).',
    outputFormat: 'In ra một số nguyên duy nhất là giá trị lớn nhất của 3 số đã cho.',
    constraints: '-10^9 <= a, b, c <= 10^9',
    sampleInput: '4 9 2',
    sampleOutput: '9',
    sampleExplanation: 'Trong ba số 4, 9, 2 thì số 9 là số lớn nhất.',
    starterCode: `# Nhập dữ liệu và xử lý bài toán
import sys

input_data = sys.stdin.read().split()
if input_data:
    a = int(input_data[0])
    b = int(input_data[1])
    c = int(input_data[2])
    # Hãy viết logic tìm số lớn nhất ở đây
    
`,
    solutionCode: `import sys

input_data = sys.stdin.read().split()
if input_data:
    a = int(input_data[0])
    b = int(input_data[1])
    c = int(input_data[2])
    max_val = a
    if b > max_val:
        max_val = b
    if c > max_val:
        max_val = c
    print(max_val)
`,
    testCases: [
      { id: 1, input: '4 9 2', expectedOutput: '9', isHidden: false, description: 'Test ví dụ mẫu' },
      { id: 2, input: '15 8 12', expectedOutput: '15', isHidden: false, description: 'Test số lớn nhất ở vị trí đầu tiên' },
      { id: 3, input: '-5 -2 -9', expectedOutput: '-2', isHidden: true, description: 'Test ba số âm' },
      { id: 4, input: '0 0 0', expectedOutput: '0', isHidden: true, description: 'Test ba số bằng nhau bằng 0' },
      { id: 5, input: '7 7 3', expectedOutput: '7', isHidden: true, description: 'Test có hai số bằng nhau' },
      { id: 6, input: '-100 0 50', expectedOutput: '50', isHidden: true, description: 'Test kết hợp số âm, số 0 và số dương' },
      { id: 7, input: '1000000000 999999999 100000000', expectedOutput: '1000000000', isHidden: true, description: 'Test số rất lớn (cận biên)' },
      { id: 8, input: '12\n45\n30', expectedOutput: '45', isHidden: true, description: 'Test nhập dữ liệu trên 3 dòng' }
    ],
    createdAt: '2026-10-14T08:00:00.000Z'
  },
  {
    id: 'ex-2',
    code: 'TH1002',
    title: 'Tính tổng các số chẵn từ 1 đến N',
    grade: '10',
    topic: 'Vòng lặp for',
    difficulty: 'Dễ',
    description: 'Cho số nguyên dương N. Em hãy viết chương trình sử dụng vòng lặp để tính tổng tất cả các số nguyên chẵn trong đoạn từ 1 đến N (tức là 2 + 4 + 6 + ... <= N).',
    inputFormat: 'Một dòng duy nhất chứa số nguyên dương N.',
    outputFormat: 'In ra một số nguyên duy nhất là tổng các số chẵn từ 1 đến N.',
    constraints: '1 <= N <= 10^6',
    sampleInput: '6',
    sampleOutput: '12',
    sampleExplanation: 'Các số chẵn từ 1 đến 6 là 2, 4, 6. Tổng là 2 + 4 + 6 = 12.',
    starterCode: `# Nhập N và tính tổng các số chẵn
n = int(input().strip())
tong = 0

# Viết vòng lặp tính tổng tại đây

print(tong)
`,
    solutionCode: `import sys

raw = sys.stdin.read().strip()
if raw:
    n = int(raw.split()[0])
    tong = 0
    for i in range(2, n + 1, 2):
        tong += i
    print(tong)
`,
    testCases: [
      { id: 1, input: '6', expectedOutput: '12', isHidden: false, description: 'Test ví dụ mẫu N=6' },
      { id: 2, input: '10', expectedOutput: '30', isHidden: false, description: 'Test N=10 (2+4+6+8+10 = 30)' },
      { id: 3, input: '1', expectedOutput: '0', isHidden: true, description: 'Test biên nhỏ nhất N=1 (không có số chẵn nào)' },
      { id: 4, input: '2', expectedOutput: '2', isHidden: true, description: 'Test N=2' },
      { id: 5, input: '7', expectedOutput: '12', isHidden: true, description: 'Test N là số lẻ (N=7)' },
      { id: 6, input: '100', expectedOutput: '2550', isHidden: true, description: 'Test N=100' },
      { id: 7, input: '1001', expectedOutput: '250500', isHidden: true, description: 'Test N số lẻ lớn' },
      { id: 8, input: '20000', expectedOutput: '100010000', isHidden: true, description: 'Test N lớn' }
    ],
    createdAt: '2026-10-14T08:00:00.000Z'
  },
  {
    id: 'ex-3',
    code: 'TH1003',
    title: 'Đếm nguyên âm trong xâu ký tự',
    grade: '10',
    topic: 'Xâu ký tự (String)',
    difficulty: 'Trung bình',
    description: 'Viết chương trình nhập vào một xâu ký tự S (gồm cả chữ hoa, chữ thường và dấu cách). Đếm xem trong xâu có bao nhiêu ký tự nguyên âm tiếng Anh (gồm: a, e, i, o, u không phân biệt chữ hoa hay thường).',
    inputFormat: 'Một dòng chứa xâu ký tự S.',
    outputFormat: 'In ra một số nguyên là số lượng ký tự nguyên âm trong xâu.',
    constraints: 'Độ dài xâu S từ 1 đến 1000 ký tự.',
    sampleInput: 'Lap trinh Python',
    sampleOutput: '3',
    sampleExplanation: 'Các nguyên âm trong xâu "Lap trinh Python" là: a, i, o (tổng cộng 3 nguyên âm; ký tự y không tính trong nguyên âm cơ bản a, e, i, o, u).',
    starterCode: `# Nhập xâu và đếm nguyên âm
import sys

s = sys.stdin.read().rstrip('\\r\\n')
vowels = "aeiouAEIOU"
count = 0

# Viết vòng lặp duyệt qua xâu s

print(count)
`,
    solutionCode: `import sys

s = sys.stdin.read().rstrip('\\r\\n')
vowels = set("aeiouAEIOU")
count = 0
for ch in s:
    if ch in vowels:
        count += 1
print(count)
`,
    testCases: [
      { id: 1, input: 'Lap trinh Python', expectedOutput: '3', isHidden: false, description: 'Test ví dụ mẫu' },
      { id: 2, input: 'HELLO WORLD', expectedOutput: '3', isHidden: false, description: 'Test toàn chữ hoa (E, O, O)' },
      { id: 3, input: 'bcdfg hjkl', expectedOutput: '0', isHidden: true, description: 'Test không có nguyên âm nào' },
      { id: 4, input: 'aeiou', expectedOutput: '5', isHidden: true, description: 'Test chỉ toàn nguyên âm thường' },
      { id: 5, input: 'A E I O U', expectedOutput: '5', isHidden: true, description: 'Test nguyên âm hoa cách nhau bởi dấu cách' },
      { id: 6, input: 'Tin hoc 10 Canh Dieu 2026', expectedOutput: '6', isHidden: true, description: 'Test có chữ số và chữ xen kẽ' },
      { id: 7, input: 'a', expectedOutput: '1', isHidden: true, description: 'Test xâu chỉ có 1 ký tự nguyên âm' },
      { id: 8, input: 'z', expectedOutput: '0', isHidden: true, description: 'Test xâu chỉ có 1 ký tự phụ âm' }
    ],
    createdAt: '2026-10-14T08:00:00.000Z'
  },
  {
    id: 'ex-4',
    code: 'TH1101',
    title: 'Tìm phần tử lớn thứ nhì trong danh sách',
    grade: '11',
    topic: 'Danh sách và Thuật toán',
    difficulty: 'Trung bình',
    description: 'Cho danh sách gồm N số nguyên. Hãy tìm giá trị lớn thứ nhì (nghiêm ngặt nhỏ hơn giá trị lớn nhất) trong danh sách. Nếu danh sách không có giá trị lớn thứ nhì (ví dụ tất cả phần tử bằng nhau), in ra "KHONG CO".',
    inputFormat: 'Dòng thứ nhất chứa số nguyên N (2 <= N <= 10^5). Dòng thứ hai chứa N số nguyên cách nhau bởi dấu cách.',
    outputFormat: 'In ra giá trị lớn thứ nhì hoặc xâu "KHONG CO".',
    constraints: '2 <= N <= 10^5, -10^9 <= a[i] <= 10^9',
    sampleInput: '5\\n10 20 20 8 15',
    sampleOutput: '15',
    sampleExplanation: 'Các giá trị phân biệt trong dãy theo thứ tự giảm dần là 20, 15, 10, 8. Giá trị lớn thứ nhì là 15.',
    starterCode: `import sys

data = sys.stdin.read().split()
if len(data) >= 2:
    n = int(data[0])
    a = [int(x) for x in data[1:n+1]]
    # Tìm giá trị lớn thứ nhì nghiêm ngặt
    
`,
    solutionCode: `import sys

data = sys.stdin.read().split()
if len(data) >= 2:
    n = int(data[0])
    a = [int(x) for x in data[1:n+1]]
    distinct_sorted = sorted(list(set(a)), reverse=True)
    if len(distinct_sorted) >= 2:
        print(distinct_sorted[1])
    else:
        print("KHONG CO")
`,
    testCases: [
      { id: 1, input: '5\\n10 20 20 8 15', expectedOutput: '15', isHidden: false, description: 'Test ví dụ có phần tử lớn nhất lặp lại' },
      { id: 2, input: '4\\n5 9 1 3', expectedOutput: '5', isHidden: false, description: 'Test dãy phân biệt' },
      { id: 3, input: '3\\n7 7 7', expectedOutput: 'KHONG CO', isHidden: true, description: 'Test tất cả phần tử bằng nhau' },
      { id: 4, input: '2\\n-10 -20', expectedOutput: '-20', isHidden: true, description: 'Test 2 phần tử số âm' },
      { id: 5, input: '6\\n-5 -2 -1 -10 -2 -1', expectedOutput: '-2', isHidden: true, description: 'Test số âm lặp lại' },
      { id: 6, input: '2\\n100 100', expectedOutput: 'KHONG CO', isHidden: true, description: 'Test N=2 có 2 số bằng nhau' },
      { id: 7, input: '6\\n0 0 0 1 0 0', expectedOutput: '0', isHidden: true, description: 'Test số 0 và 1' },
      { id: 8, input: '5\\n1000000000 999999999 1000000000 5 10', expectedOutput: '999999999', isHidden: true, description: 'Test cận biên số lớn' }
    ],
    createdAt: '2026-10-14T08:00:00.000Z'
  }
];
