from flask import Flask, request, session, render_template
app = Flask(__name__)
app.config.from_object(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def main(path):
    return render_template('main.html')

if __name__ == '__main__':
    app.debug = True
    app.run()