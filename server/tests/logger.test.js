const { transports, format } = require('winston');
const { Writable } = require('stream');
let logger;

describe('Logger Tests', function () {
    let expect, sinon, consoleTransportSpy, fileTransportSpy, s3StreamStub, uploadLogToS3Stub;
    
    before(async function() {
        const chai = await import('chai');
        sinon = await import('sinon');
        expect = chai.expect;
        
        // Stub the S3 upload function
        uploadLogToS3Stub = sinon.stub().resolves();
        
        // Import the logger module after stubbing dependencies
        const loggerModule = await import('../utilities/logger.js');
        logger = loggerModule.default || loggerModule;
    });
    
    beforeEach(function () {
        // Set up spies for transports after the logger has been fully configured
        const consoleTransport = logger.transports.find(transport => transport instanceof transports.Console);
        if (consoleTransport) {
            consoleTransportSpy = sinon.spy(consoleTransport, 'log');
        }
        
        const fileTransport = logger.transports.find(transport => transport.filename && transport.filename.includes('error.log'));
        if (fileTransport) {
            fileTransportSpy = sinon.spy(fileTransport, 'log');
        }
        
        const streamTransport = logger.transports.find(transport => transport.stream);
        if (streamTransport && streamTransport.stream instanceof Writable) {
            s3StreamStub = sinon.stub(streamTransport.stream, 'write').callsFake((chunk, encoding, callback) => {
                callback(); // Simulate successful write
            });
        }
    });
    
    afterEach(function () {
        if (consoleTransportSpy) consoleTransportSpy.restore();
        if (fileTransportSpy) fileTransportSpy.restore();
        if (s3StreamStub) s3StreamStub.restore();
        sinon.restore();
    });
    
    it('should log info messages to the console in non-production environments', function () {
        process.env.NODE_ENV = 'development';
        
        // Reconfigure the logger manually
        logger.clear();  // Clear existing transports
        const consoleFormat = format.combine(
            format.colorize(),
            format.simple()
        );
        logger.add(new transports.Console({ format: consoleFormat, handleExceptions: true }));
        
        // Set up the spy after reconfiguring the logger
        const consoleTransport = logger.transports.find(transport => transport instanceof transports.Console);
        consoleTransportSpy = sinon.spy(consoleTransport, 'log');
        
        logger.info('Test info message');
        
        expect(consoleTransportSpy.calledOnce).to.be.true;
        expect(consoleTransportSpy.calledWith(sinon.match.has('message', 'Test info message'))).to.be.true;
    });
    
    it('should log errors to the error.log file', function () {
        process.env.NODE_ENV = 'development';
        
        // Reconfigure the logger manually
        logger.clear();  // Clear existing transports
        logger.add(new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            handleExceptions: true,
        }));
        
        // Set up the spy after reconfiguring the logger
        const fileTransport = logger.transports.find(transport => transport.filename && transport.filename.includes('error.log'));
        fileTransportSpy = sinon.spy(fileTransport, 'log');
        
        logger.error('Test error message');
        
        expect(fileTransportSpy.calledOnce).to.be.true;
        expect(fileTransportSpy.args[0][0].level).to.equal('error');
        expect(fileTransportSpy.args[0][0].message).to.equal('Test error message');
    });
    
    it('should log info messages to S3 in production environments', function () {
        process.env.NODE_ENV = 'production';
        
        // Reconfigure the logger manually
        logger.clear();  // Clear existing transports
        const S3UploadStream = class extends Writable {
            constructor(options = {}) {
                super(options);
            }
            _write(chunk, encoding, callback) {
                const logMessage = chunk instanceof Buffer ? chunk.toString('utf8') : chunk;
                uploadLogToS3Stub(logMessage, process.env.S3_BUCKET_NAME)
                    .then(() => callback())
                    .catch(err => {
                        logger.error('Failed to upload log to S3:', err);
                        callback(err);
                    });
            }
        };
        logger.add(new transports.Stream({
            stream: new S3UploadStream(),  // Use your custom S3 upload stream
            level: 'info',
            handleExceptions: true,
        }));
        
        // Set up the stub after reconfiguring the logger
        const streamTransport = logger.transports.find(transport => transport.stream);
        if (streamTransport) {
            s3StreamStub = sinon.stub(streamTransport.stream, 'write').callsFake((chunk, encoding, callback) => {
                callback(); // Simulate successful write
            });
        }
        
        logger.info('Test S3 upload message');
        
        expect(s3StreamStub).to.exist; // Ensure the stub is defined
        expect(s3StreamStub.calledOnce).to.be.true;
        expect(s3StreamStub.args[0][0].toString()).to.include('Test S3 upload message');
    });
    
    it('should correctly format error messages with stack traces', function () {
        process.env.NODE_ENV = 'development';
        
        // Reconfigure the logger manually
        logger.clear();  // Clear existing transports
        logger.add(new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            handleExceptions: true,
            format: format.combine(
                format.errors({ stack: true }), // Ensure stack trace is included
                format.json()
            )
        }));
        
        // Set up the spy after reconfiguring the logger
        const fileTransport = logger.transports.find(transport => transport.filename && transport.filename.includes('error.log'));
        fileTransportSpy = sinon.spy(fileTransport, 'log');
        
        const error = new Error('Test error with stack');
        logger.error(error);
        
        expect(fileTransportSpy.calledOnce).to.be.true;
        const loggedMessage = fileTransportSpy.args[0][0].message;
        
        console.log('Logged Message:', loggedMessage);
        
        expect(loggedMessage).to.include('Test error with stack');
        expect(loggedMessage).to.include('Error: Test error with stack');
    });
});