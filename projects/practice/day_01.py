# """Day 1 Python practice: input, operators, and calculations."""

# # Input and type conversion
# name = input("Enter your name: ")
# age = int(input("Enter your age: "))
# float_number = float(input("Enter a decimal number: "))
# number_list = input("Enter numbers separated by spaces: ").split()

# print(f"Your name is {name} and you are {age} years old.")
# print(f"Your decimal number is {float_number}")
# print(f"Your list of numbers is {number_list}")

# # Arithmetic operators
# first_number = 17
# second_number = 15

# print("\nArithmetic operators:")
# print("Addition:", first_number + second_number)
# print("Subtraction:", first_number - second_number)
# print("Multiplication:", first_number * second_number)
# print("Division:", first_number / second_number)
# print("Floor division:", first_number // second_number)
# print("Modulus:", first_number % second_number)
# print("Exponentiation:", first_number ** second_number)

# # Comparison operators
# print("\nComparison operators:")
# print("Greater than:", first_number > second_number)
# print("Less than:", first_number < second_number)
# print("Greater than or equal to:", first_number >= second_number)
# print("Less than or equal to:", first_number <= second_number)
# print("Equal to:", first_number == second_number)
# print("Not equal to:", first_number != second_number)
# print("Same object:", first_number is second_number)
# print("Different objects:", first_number is not second_number)
# print("17 is in the list:", first_number in [10, 15, 17])
# print("17 is not in the list:", first_number not in [10, 15, 17])

# # Logical operators
# print("\nLogical operators:")
# has_id = True
# is_adult = False
# print("AND:", has_id and is_adult)
# print("OR:", has_id or is_adult)
# print("NOT:", not has_id)

# # Price calculation with a discount
# print("\nPrice calculation:")
# price = 250
# quantity = 5
# discount = 0.3

# subtotal = price * quantity
# discount_amount = subtotal * discount
# total = subtotal - discount_amount

# print("Price before discount:", subtotal)
# print("Discount amount:", discount_amount)
# print("Price after discount:", total)


# print(5==5.00000000000000009)

# while True:
#     num1 = input("Enter a number: ")
#     num = num1  # Convert the input to an integer
#     num = int(num)
#     exit = num1
#     if num>0:
#         print("The number is positive.")
#     elif num<0:
#         print("The number is negative.")
    
#     elif exit == "exit":
#         break    
#     else:
#         print("The number is zero.")
    


# for i in range(1, 20):
#     if i%3==0 and i%5==0:
#         print("FizzBuzz")
#     elif i%3==0:
#         print("Fizz")
#     elif i%5==0:
#         print("Buzz")
#     else:
#         print(i)

# sum = 0
# for i in range(0, 101):
#     sum += i
# print("The sum of numbers from 0 to 100 is:", sum)





# num = int(input("Enter a number : "))

# for i in range(1, 11):
#     table = num * i
#     print(f"{num} x {i} = {table}")




# for i in range(10, 0,   -1):
#     print(i)
# print("liftoff")



# vowel = ['a', 'e', 'i', 'o', 'u']
# string = input("Enter a string: ")
# count = 0
# for i in range(len(string)):
#     print(string[i])
#     for j in range(len(vowel)):
#         if string[i] == vowel[j]:
#             count += 1
#             break
# print("The number of vowels in the string is: ", count)


li = [1, 2, 3, 4, 5]
reversed_li = []
ind = len(li)-1
for i in range(len(li)):
    reversed_li.append(li[ind])
    ind -= 1
print("Original list:", li)
print("Reversed list:", reversed_li)


word = "hello"

# word[0]= "H"

print(word)  


a = 7/2

print(a)


total = 0
for n in range(1, 4):
    total = 0
    total += n
print(total)


prices = {"apple": 100}
print(prices.get("banana", 0))


names = ["Ali", "Zara"]
marks = [90, 85, 70]
for name, mark in zip(names, marks):
    print(name, mark)



nums = [3, 1, 2]
result = nums.sort()
print(result)