from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/calculate', methods=['POST'])
def calculate_impact():
    data = request.json

    # 1. Get Velocity (km/s) and Diameter (meters)
    velocity_kms = data.get('velocity', 0)
    diameter_m = data.get('diameter', 10) # Default to 10m if missing

    # 2. Physics Logic (Simplified)
    # Mass = Volume * Density. Assume spherical rock (density ~3000 kg/m^3)
    radius = diameter_m / 2
    volume = (4/3) * 3.14159 * (radius ** 3)
    mass_kg = volume * 3000

    # Velocity needs to be m/s for Physics formula (KE = 0.5 * m * v^2)
    velocity_ms = velocity_kms * 1000
    kinetic_energy_joules = 0.5 * mass_kg * (velocity_ms ** 2)

    # Convert Joules to Kilotons of TNT (1 Kiloton = 4.184 x 10^12 Joules)
    kilotons = kinetic_energy_joules / (4.184 * (10 ** 12))

    return jsonify({
        "asteroid_size": f"{diameter_m} meters",
        "impact_energy": f"{kilotons:.2f} Kilotons of TNT",
        "status": "CATASTROPHIC" if kilotons > 1000 else "MANAGABLE"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)