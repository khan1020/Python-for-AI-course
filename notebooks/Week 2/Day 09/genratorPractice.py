def count_to_three():
    for i in range(1, 4):
        yield i  # Hands the number over, then pauses

# How to use it:
for num in count_to_three():
    print(num) 
# Prints: 1, 2, 3



# def simple_decorator(func):
#     def wrapper():
#         print("--- BEFORE ---")
#         func()
#         print("--- AFTER ---")
#     return wrapper

# i = 0
# i+=1
# @simple_decorator
# def say_hello(num):
#         print(num)

# for num in range(1,10):
#     say_hello(num)



def simple_decorator(func):
    # 1. Add *args, **kwargs here so the wrapper can accept 'num'
    def wrapper(*args, **kwargs):
        print("--- BEFORE ---")
        
        # 2. Pass *args, **kwargs into func() so say_hello gets the 'num'
        func(*args, **kwargs)
        
        print("--- AFTER ---")
    return wrapper

@simple_decorator
def say_hello(num):
    print(f"The number is: {num}")

# Now it works perfectly!
for num in range(1, 10):  # Reduced to 4 just for shorter output
    say_hello(num)