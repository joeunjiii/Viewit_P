# interview/utils/timing.py

import time
import functools

def timing_logger(step_name):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            result = await func(*args, **kwargs)
            end = time.time()
            print(f"[{step_name}] {end-start:.3f}초")
            return result
        return wrapper
    return decorator
