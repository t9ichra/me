from flask import Flask, render_template, send_file

app = Flask(__name__)

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/lobby')
def lobby():
    return render_template('looby.html')

@app.route('/lore')
def lore():
    return render_template('lore.html')


@app.route('/game')
def game():
    return render_template('main.html')

@app.route('/manage_account')
def manage():
    return render_template('manage.html')

if __name__ == '__main__':
    app.run(debug=True, port=8080)  
