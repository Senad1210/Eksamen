from flask import Flask, render_template, jsonify, request, session
import mysql.connector
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()                         # Load variables from .env

app = Flask(__name__)                 # Creates the flask application instance
app.secret_key = os.getenv("FLASK_SECRET_KEY") # Secret key from environment variable

#────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────#   
# Database connection (Raspberry pi)

def get_db():                                # Define a function that opens and returns a new database connection
    return mysql.connector.connect(          # Returns mysql connection from database
        host=os.getenv("DB_HOST"),           # Ip adress to database
        port=int(os.getenv("DB_PORT")),      # Mysql port (may be blocked or allowed by firewall)
        user=os.getenv("DB_USER"),           # Mariadb user-name
        password=os.getenv("DB_PASSWORD"),   # Mariadb password for user
        database=os.getenv("DB_NAME")        # Name of the database to use
    )




@app.route("/hidden-info")
def home():
    return "Database connection configured!"










#────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────#   
# homepage

# Home page route that loads products from the database and checks if a user is logged in
@app.route("/")                              # Home page route
def home():                                  # Loads the homepage and gets products from the database

    # Gets all products from the database and stores them in "products"
    con = get_db()                           # Opens connection to database
    cur = con.cursor(dictionary=True)        # Lets you run sql commands and get results as dictionaries
    cur.execute("SELECT * FROM products")    # Gets all 'products' from database
    products = cur.fetchall()                # Takes data and stores it in a Python variable

    # Checks if a user is logged in and gets their name from the database
    user = None                              # No user logged in by default
    if "user_id" in session:                 # Check if a user is logged in
        cur.execute("SELECT name FROM users WHERE id = %s", (session["user_id"],)) # Get user name from database
        user = cur.fetchone()                # Store the user data

    # Closes the database connection and sends data to the HTML page
    con.close()                                                          # Closes the database connection
    return render_template("index.html", products=products, user=user)   # Sends data to html page

#────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────#   
# registrering

# API route for user registration
@app.route("/api/register", methods=["POST"])   # Creates the /api/register endpoint and only allows POST requests
def register():                                 # function that handles user registration
    # Gets json data from frontend
    data     = request.get_json()
    name     = data["name"]                     # User name
    email    = data["email"]                    # User email
    password = data["password"]                 # User password

    # Checks if fields are empty
    if not name or not email or not password:
        return jsonify({"ok": False, "error": "Fill in all fields."})

    # Hash password for security
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    # Takes password → converts to bytes → adds random salt → hashes it → returns encrypted password string
    ip = request.remote_addr
    # Reads the user's IP address from the incoming request sent to the server

    # Adds a new user to the database, logs them in, and returns a JSON response
    try:
        con = get_db()           # Opens connection to database
        cur = con.cursor()       # Creates a cursor that allows us to run sql commands
        cur.execute(
            "INSERT INTO users (name, email, password, active, ip_address) VALUES (%s, %s, %s, 'enabled', %s)",
            (name, email, hashed_password, ip)
        ) 
        # Sends SQL query to database and safely inserts user data

        con.commit()                           # Commits the changes permenantly in the database
        session["user_id"] = cur.lastrowid     # Stores the new user's ID in session (logs the user in)
        con.close()                            # Closes the database connection

    except Exception as e:                     # Runs if something goes wrong in the try block
        return jsonify({"ok": False, "error": str(e)})   # Sends error message back to frontend

    return jsonify({"ok": True})               # Sends success response back to frontend

#────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────#   
# Log in

# API route for user log in
@app.route("/api/login", methods=["POST"])     # Creates the /api/login endpoint and only allows POST requests
def login():                                   # Function that handles user login
    data     = request.get_json()                 # Converts JSON from JavaScript into a Python dictionary
    email    = data["email"]                      # Gets email from the request data
    password = data["password"]                   # Gets password from the request data

    try:
        con = get_db()                             # Opens connection to the database
        cur = con.cursor(dictionary=True)          # Creates cursor that returns rows as dictionaries
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))   # Searches database for user with matching email
        user = cur.fetchone()                      # Gets one user result or None if not found
        con.close()                                # Closes database connection

        if not user:     # If no user was found with that email
            return jsonify({"ok": False, "error": "No account with that email."})

        if not bcrypt.checkpw(password.encode(), user["password"].encode()):   # Compares entered password with hashed password in database
            return jsonify({"ok": False, "error": "Wrong password."})

        if user.get("active") == "disabled":     # Checks if account is disabled
            return jsonify({"ok": False, "error": "This account has been disabled."})

        session["user_id"] = user["id"]          # Logs user in by saving user id in session
        return jsonify({"ok": True})             # Sends success response to frontend

    except Exception as e:                                # Runs if something goes wrong
        return jsonify({"ok": False, "error": str(e)})    # Sends error message to frontend

#────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────#   
# Log out

@app.route("/api/logout", methods=["POST"])     # Creates the /api/logout endpoint and only allows POST requests
def logout():                                   # Function that logs the user out
    session.clear()                             # Removes all data stored in session (logs the user out)
    return jsonify({"ok": True})                # Sends success response back to frontend




#────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────#   
# Chekout

@app.route("/api/checkout", methods=["POST"])        # Creates the /api/checkout endpoint and only allows POST requests
def checkout():                                      # Function that processes a users order
    if "user_id" not in session:                     # Checks if user is logged in (session must contain user_id)
        return jsonify({"ok": False, "error": "You must be logged in."})   # If not logged in send error response

    items = request.get_json()["items"]                                # Gets cart items sent from JavaScript (JSON → Python)
    total = sum(item["price"] * item["qty"] for item in items)         # Calculates total price of all items in cart

    con = get_db()          # Opens database connection
    cur = con.cursor()      # Creates cursor to run SQL commands

    cur.execute(
        "INSERT INTO orders (user_id, total) VALUES (%s, %s)",
        (session["user_id"], total)
    )   # Creates a new order in the database

    order_id = cur.lastrowid     # Gets id of the newly created order

    for item in items:           # Loops through each product in the cart
        cur.execute(
            "INSERT INTO order_items (order_id, product_id, product_name, price, qty) VALUES (%s, %s, %s, %s, %s)",
            (order_id, item["id"], item["name"], item["price"], item["qty"])
        )                        # Saves each product as a separate order item in the database

    con.commit()                 # Saves order and items permanently in database
    con.close()                  # Closes database connection
    return jsonify({"ok": True, "order_id": order_id})     # Sends success response back to frontend with order ID













    
# Starts the server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)